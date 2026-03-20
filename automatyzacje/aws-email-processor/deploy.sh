#!/bin/bash
# deploy.sh — Idempotent deployment script for ArtNapi Email Processor Lambda
# Creates or updates ALL AWS resources: S3, DynamoDB, IAM, Lambda, API Gateway, EventBridge
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh                    # Full deploy (create or update)
#   ./deploy.sh update-code        # Update Lambda code only (faster)
#   ./deploy.sh sync-kb            # Sync knowledge base files to S3 only
#   ./deploy.sh create-secret      # Create Secrets Manager secret (interactive)
#   ./deploy.sh dashboard          # Create/update CloudWatch dashboard + alarms
#   ./deploy.sh canary             # Deploy canary (health check) Lambda only
#   ./deploy.sh watch-renewal      # Deploy Gmail watch renewal Lambda only
#   ./deploy.sh weekly-stats       # Deploy weekly stats Lambda only
#   ./deploy.sh extras             # Deploy all extras (dashboard + alarms + canary + watch + stats)
#
# Prerequisites:
#   - AWS CLI v2 configured with appropriate credentials
#   - Permissions: Lambda, S3, DynamoDB, IAM, API Gateway, EventBridge, Secrets Manager, Bedrock, CloudWatch, SNS

set -euo pipefail

# --- Configuration ---
REGION="eu-west-1"
BEDROCK_REGION="us-east-1"
FUNCTION_NAME="artnapi-email-processor"
ROLE_NAME="artnapi-email-processor-role"
S3_BUCKET="artnapi-email-processor-kb"
DYNAMO_TABLE="email-processor-state"
SECRET_NAME="artnapi-email-processor/credentials"
API_NAME="email-processor-webhook"
EVENTBRIDGE_RULE="email-processor-fallback"
LOG_GROUP="/aws/lambda/${FUNCTION_NAME}"

# --- Extra Lambdas Configuration ---
CANARY_FUNCTION_NAME="artnapi-email-processor-canary"
WATCH_RENEWAL_FUNCTION_NAME="artnapi-gmail-watch-renewal"
WEEKLY_STATS_FUNCTION_NAME="artnapi-email-processor-stats"
SNS_TOPIC_NAME="artnapi-email-processor-alerts"
DASHBOARD_NAME="artnapi-email-processor"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
MEMORY=512
TIMEOUT=120
MY_EMAIL="mateusz.sokolski@artnapi.pl"
TELEGRAM_CHAT_ID="1304598782"
NOTION_CRM_DATASOURCE_ID="26f862e1-4a0c-808f-a249-000b2cee31df"
BEDROCK_MODEL_ID="anthropic.claude-sonnet-4-6-20250514-v1:0"

# Repo root (for S3 KB sync)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()   { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# --- Get AWS Account ID ---
get_account_id() {
  aws sts get-caller-identity --query 'Account' --output text --region "${REGION}"
}

# ============================================================
# 1. S3 BUCKET (Knowledge Base)
# ============================================================
create_s3_bucket() {
  log "Creating S3 bucket: ${S3_BUCKET}..."

  if aws s3api head-bucket --bucket "${S3_BUCKET}" --region "${REGION}" 2>/dev/null; then
    log "S3 bucket already exists."
  else
    aws s3api create-bucket \
      --bucket "${S3_BUCKET}" \
      --region "${REGION}" \
      --create-bucket-configuration LocationConstraint="${REGION}"

    log "S3 bucket created."
  fi

  # Block all public access
  aws s3api put-public-access-block \
    --bucket "${S3_BUCKET}" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

  # Enable versioning
  aws s3api put-bucket-versioning \
    --bucket "${S3_BUCKET}" \
    --versioning-configuration Status=Enabled

  # Enable default encryption (SSE-S3)
  aws s3api put-bucket-encryption \
    --bucket "${S3_BUCKET}" \
    --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

  log "S3 bucket configured (public access blocked, versioning ON, encryption ON)."
}

sync_knowledge_base() {
  log "Syncing knowledge base files to S3..."

  local oferta="${REPO_ROOT}/dane/artnapi/oferta.md"
  local ghost="${REPO_ROOT}/dane/ghost_styl.md"

  if [[ -f "${oferta}" ]]; then
    aws s3 cp "${oferta}" "s3://${S3_BUCKET}/oferta.md" --region "${REGION}"
    log "  Uploaded oferta.md"
  else
    warn "  oferta.md not found at ${oferta}"
  fi

  if [[ -f "${ghost}" ]]; then
    aws s3 cp "${ghost}" "s3://${S3_BUCKET}/ghost_styl.md" --region "${REGION}"
    log "  Uploaded ghost_styl.md"
  else
    warn "  ghost_styl.md not found at ${ghost}"
  fi

  log "Knowledge base sync complete."
}

# ============================================================
# 2. DYNAMODB TABLE (State)
# ============================================================
create_dynamo_table() {
  log "Creating DynamoDB table: ${DYNAMO_TABLE}..."

  if aws dynamodb describe-table --table-name "${DYNAMO_TABLE}" --region "${REGION}" 2>/dev/null; then
    log "DynamoDB table already exists."
  else
    aws dynamodb create-table \
      --table-name "${DYNAMO_TABLE}" \
      --attribute-definitions AttributeName=PK,AttributeType=S \
      --key-schema AttributeName=PK,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST \
      --region "${REGION}"

    log "Waiting for table to become active..."
    aws dynamodb wait table-exists --table-name "${DYNAMO_TABLE}" --region "${REGION}"
    log "DynamoDB table created."
  fi

  # Enable TTL on 'ttl' attribute
  aws dynamodb update-time-to-live \
    --table-name "${DYNAMO_TABLE}" \
    --time-to-live-specification "Enabled=true,AttributeName=ttl" \
    --region "${REGION}" 2>/dev/null || true

  log "DynamoDB TTL enabled on 'ttl' attribute."
}

# ============================================================
# 3. IAM ROLE (Lambda execution role)
# ============================================================
create_iam_role() {
  local ACCOUNT_ID
  ACCOUNT_ID=$(get_account_id)

  log "Creating IAM role: ${ROLE_NAME}..."

  # Trust policy (allow Lambda to assume this role)
  local TRUST_POLICY='{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {"aws:SourceAccount": "'"${ACCOUNT_ID}"'"}
      }
    }]
  }'

  if aws iam get-role --role-name "${ROLE_NAME}" 2>/dev/null; then
    log "IAM role already exists. Updating trust policy..."
    aws iam update-assume-role-policy \
      --role-name "${ROLE_NAME}" \
      --policy-document "${TRUST_POLICY}"
  else
    aws iam create-role \
      --role-name "${ROLE_NAME}" \
      --assume-role-policy-document "${TRUST_POLICY}" \
      --description "Execution role for ArtNapi Email Processor Lambda"
    log "IAM role created."
  fi

  # Inline policy with least-privilege permissions
  local POLICY='{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "SecretsManagerRead",
        "Effect": "Allow",
        "Action": ["secretsmanager:GetSecretValue"],
        "Resource": "arn:aws:secretsmanager:'"${REGION}"':'"${ACCOUNT_ID}"':secret:artnapi-email-processor/*"
      },
      {
        "Sid": "S3KnowledgeBaseRead",
        "Effect": "Allow",
        "Action": ["s3:GetObject", "s3:HeadObject"],
        "Resource": "arn:aws:s3:::'"${S3_BUCKET}"'/*"
      },
      {
        "Sid": "DynamoDBState",
        "Effect": "Allow",
        "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query"],
        "Resource": "arn:aws:dynamodb:'"${REGION}"':'"${ACCOUNT_ID}"':table/'"${DYNAMO_TABLE}"'"
      },
      {
        "Sid": "BedrockInvoke",
        "Effect": "Allow",
        "Action": ["bedrock:InvokeModel"],
        "Resource": "arn:aws:bedrock:'"${BEDROCK_REGION}"'::foundation-model/anthropic.claude-sonnet-4-6*"
      },
      {
        "Sid": "CloudWatchLogs",
        "Effect": "Allow",
        "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        "Resource": "arn:aws:logs:'"${REGION}"':'"${ACCOUNT_ID}"':log-group:'"${LOG_GROUP}"':*"
      }
    ]
  }'

  aws iam put-role-policy \
    --role-name "${ROLE_NAME}" \
    --policy-name "${FUNCTION_NAME}-policy" \
    --policy-document "${POLICY}"

  log "IAM policy attached."

  # Wait for IAM propagation (needed on first create)
  sleep 5
}

# ============================================================
# 4. LAMBDA FUNCTION
# ============================================================
create_lambda() {
  local ACCOUNT_ID
  ACCOUNT_ID=$(get_account_id)
  local ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

  log "Packaging Lambda function..."

  local ZIP_FILE="/tmp/${FUNCTION_NAME}.zip"
  # Package all .mjs files + package.json
  (cd "${SCRIPT_DIR}" && zip -j "${ZIP_FILE}" *.mjs package.json)

  log "Deploying Lambda function: ${FUNCTION_NAME}..."

  # Environment variables (non-secret config)
  local ENV_VARS='{
    "Variables": {
      "S3_BUCKET": "'"${S3_BUCKET}"'",
      "DYNAMO_TABLE": "'"${DYNAMO_TABLE}"'",
      "TELEGRAM_CHAT_ID": "'"${TELEGRAM_CHAT_ID}"'",
      "NOTION_CRM_DATASOURCE_ID": "'"${NOTION_CRM_DATASOURCE_ID}"'",
      "BEDROCK_MODEL_ID": "'"${BEDROCK_MODEL_ID}"'",
      "BEDROCK_REGION": "'"${BEDROCK_REGION}"'",
      "MY_EMAIL": "'"${MY_EMAIL}"'",
      "SECRET_NAME": "'"${SECRET_NAME}"'",
      "DAILY_BEDROCK_CAP": "50",
      "DRAFT_FREQUENCY_CAP_24H": "3"
    }
  }'

  if aws lambda get-function --function-name "${FUNCTION_NAME}" --region "${REGION}" 2>/dev/null; then
    log "Lambda function exists. Updating code..."
    aws lambda update-function-code \
      --function-name "${FUNCTION_NAME}" \
      --zip-file "fileb://${ZIP_FILE}" \
      --region "${REGION}"

    # Wait for update to complete before changing configuration
    aws lambda wait function-updated --function-name "${FUNCTION_NAME}" --region "${REGION}"

    log "Updating Lambda configuration..."
    aws lambda update-function-configuration \
      --function-name "${FUNCTION_NAME}" \
      --runtime "${RUNTIME}" \
      --handler "${HANDLER}" \
      --memory-size "${MEMORY}" \
      --timeout "${TIMEOUT}" \
      --environment "${ENV_VARS}" \
      --role "${ROLE_ARN}" \
      --region "${REGION}"

    aws lambda wait function-updated --function-name "${FUNCTION_NAME}" --region "${REGION}"
  else
    log "Creating new Lambda function..."

    # IAM role may need a few seconds to propagate
    local retries=0
    while ! aws lambda create-function \
      --function-name "${FUNCTION_NAME}" \
      --runtime "${RUNTIME}" \
      --handler "${HANDLER}" \
      --memory-size "${MEMORY}" \
      --timeout "${TIMEOUT}" \
      --role "${ROLE_ARN}" \
      --zip-file "fileb://${ZIP_FILE}" \
      --environment "${ENV_VARS}" \
      --region "${REGION}" 2>/dev/null; do
      retries=$((retries + 1))
      if [[ ${retries} -ge 5 ]]; then
        error "Failed to create Lambda after ${retries} retries."
        exit 1
      fi
      warn "IAM role not ready, retrying in 10s... (${retries}/5)"
      sleep 10
    done

    aws lambda wait function-active --function-name "${FUNCTION_NAME}" --region "${REGION}"
  fi

  log "Lambda function deployed."

  # Set CloudWatch Logs retention to 30 days
  aws logs put-retention-policy \
    --log-group-name "${LOG_GROUP}" \
    --retention-in-days 30 \
    --region "${REGION}" 2>/dev/null || true

  rm -f "${ZIP_FILE}"
}

# ============================================================
# 5. API GATEWAY (HTTP API v2)
# ============================================================
create_api_gateway() {
  local ACCOUNT_ID
  ACCOUNT_ID=$(get_account_id)

  log "Creating API Gateway: ${API_NAME}..."

  # Check if API already exists
  local API_ID
  API_ID=$(aws apigatewayv2 get-apis --region "${REGION}" \
    --query "Items[?Name=='${API_NAME}'].ApiId" --output text 2>/dev/null)

  if [[ -z "${API_ID}" || "${API_ID}" == "None" ]]; then
    # Create HTTP API
    API_ID=$(aws apigatewayv2 create-api \
      --name "${API_NAME}" \
      --protocol-type HTTP \
      --region "${REGION}" \
      --query 'ApiId' --output text)

    log "API Gateway created: ${API_ID}"
  else
    log "API Gateway already exists: ${API_ID}"
  fi

  # Get Lambda function ARN
  local LAMBDA_ARN
  LAMBDA_ARN=$(aws lambda get-function \
    --function-name "${FUNCTION_NAME}" \
    --region "${REGION}" \
    --query 'Configuration.FunctionArn' --output text)

  # Create or update Lambda integration
  local INTEGRATION_ID
  INTEGRATION_ID=$(aws apigatewayv2 get-integrations \
    --api-id "${API_ID}" \
    --region "${REGION}" \
    --query "Items[?IntegrationUri=='${LAMBDA_ARN}'].IntegrationId" --output text 2>/dev/null)

  if [[ -z "${INTEGRATION_ID}" || "${INTEGRATION_ID}" == "None" ]]; then
    INTEGRATION_ID=$(aws apigatewayv2 create-integration \
      --api-id "${API_ID}" \
      --integration-type AWS_PROXY \
      --integration-uri "${LAMBDA_ARN}" \
      --payload-format-version "2.0" \
      --region "${REGION}" \
      --query 'IntegrationId' --output text)

    log "Integration created: ${INTEGRATION_ID}"
  else
    log "Integration already exists: ${INTEGRATION_ID}"
  fi

  # Create POST /webhook route
  local ROUTE_KEY="POST /webhook"
  local ROUTE_ID
  ROUTE_ID=$(aws apigatewayv2 get-routes \
    --api-id "${API_ID}" \
    --region "${REGION}" \
    --query "Items[?RouteKey=='${ROUTE_KEY}'].RouteId" --output text 2>/dev/null)

  if [[ -z "${ROUTE_ID}" || "${ROUTE_ID}" == "None" ]]; then
    aws apigatewayv2 create-route \
      --api-id "${API_ID}" \
      --route-key "${ROUTE_KEY}" \
      --target "integrations/${INTEGRATION_ID}" \
      --region "${REGION}" > /dev/null

    log "Route created: ${ROUTE_KEY}"
  else
    log "Route already exists: ${ROUTE_KEY}"
  fi

  # Create default stage with auto-deploy
  aws apigatewayv2 create-stage \
    --api-id "${API_ID}" \
    --stage-name '$default' \
    --auto-deploy \
    --region "${REGION}" 2>/dev/null || true

  # Grant API Gateway permission to invoke Lambda
  aws lambda add-permission \
    --function-name "${FUNCTION_NAME}" \
    --statement-id "apigateway-invoke-${API_ID}" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
    --region "${REGION}" 2>/dev/null || true

  local ENDPOINT
  ENDPOINT=$(aws apigatewayv2 get-api \
    --api-id "${API_ID}" \
    --region "${REGION}" \
    --query 'ApiEndpoint' --output text)

  log "API Gateway endpoint: ${ENDPOINT}/webhook"
  echo ""
  echo "======================================="
  echo "  WEBHOOK URL: ${ENDPOINT}/webhook"
  echo "======================================="
  echo ""
}

# ============================================================
# 6. EVENTBRIDGE RULE (Fallback Polling)
# ============================================================
create_eventbridge_rule() {
  local ACCOUNT_ID
  ACCOUNT_ID=$(get_account_id)

  log "Creating EventBridge rule: ${EVENTBRIDGE_RULE}..."

  # Create or update rule
  aws events put-rule \
    --name "${EVENTBRIDGE_RULE}" \
    --schedule-expression "rate(15 minutes)" \
    --state ENABLED \
    --description "Fallback polling for email processor (in case Gmail Push fails)" \
    --region "${REGION}"

  # Get Lambda ARN
  local LAMBDA_ARN
  LAMBDA_ARN=$(aws lambda get-function \
    --function-name "${FUNCTION_NAME}" \
    --region "${REGION}" \
    --query 'Configuration.FunctionArn' --output text)

  # Add Lambda as target
  aws events put-targets \
    --rule "${EVENTBRIDGE_RULE}" \
    --targets "Id=email-processor-lambda,Arn=${LAMBDA_ARN},Input={\"source\":\"eventbridge-fallback\"}" \
    --region "${REGION}"

  # Grant EventBridge permission to invoke Lambda
  aws lambda add-permission \
    --function-name "${FUNCTION_NAME}" \
    --statement-id "eventbridge-invoke-${EVENTBRIDGE_RULE}" \
    --action lambda:InvokeFunction \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/${EVENTBRIDGE_RULE}" \
    --region "${REGION}" 2>/dev/null || true

  log "EventBridge fallback rule created (every 15 min)."
}

# ============================================================
# 7. SECRETS MANAGER (Interactive creation)
# ============================================================
create_secret() {
  log "Creating Secrets Manager secret: ${SECRET_NAME}..."

  if aws secretsmanager describe-secret --secret-id "${SECRET_NAME}" --region "${REGION}" 2>/dev/null; then
    log "Secret already exists. To update, use:"
    echo "  aws secretsmanager update-secret-value --secret-id '${SECRET_NAME}' --secret-string '{...}' --region '${REGION}'"
    return
  fi

  # Try to load values from .env file
  local ENV_FILE="${REPO_ROOT}/.env"
  local GMAIL_CLIENT_ID="" GMAIL_CLIENT_SECRET="" GMAIL_REFRESH_TOKEN="" NOTION_API_KEY="" TELEGRAM_BOT_TOKEN=""

  if [[ -f "${ENV_FILE}" ]]; then
    log "Loading credentials from .env file..."
    GMAIL_CLIENT_ID=$(grep '^GMAIL_CLIENT_ID=' "${ENV_FILE}" | cut -d'=' -f2- | tr -d '"' || true)
    GMAIL_CLIENT_SECRET=$(grep '^GMAIL_CLIENT_SECRET=' "${ENV_FILE}" | cut -d'=' -f2- | tr -d '"' || true)
    GMAIL_REFRESH_TOKEN=$(grep '^GMAIL_REFRESH_TOKEN=' "${ENV_FILE}" | cut -d'=' -f2- | tr -d '"' || true)
    NOTION_API_KEY=$(grep '^NOTION_API_KEY=' "${ENV_FILE}" | cut -d'=' -f2- | tr -d '"' || true)
    TELEGRAM_BOT_TOKEN=$(grep '^TELEGRAM_BOT_TOKEN=' "${ENV_FILE}" | cut -d'=' -f2- | tr -d '"' || true)
  fi

  if [[ -z "${GMAIL_CLIENT_ID}" || -z "${GMAIL_CLIENT_SECRET}" || -z "${GMAIL_REFRESH_TOKEN}" || -z "${NOTION_API_KEY}" || -z "${TELEGRAM_BOT_TOKEN}" ]]; then
    error "Could not find all required credentials in .env file."
    echo ""
    echo "Please create the secret manually:"
    echo ""
    echo "  aws secretsmanager create-secret \\"
    echo "    --name '${SECRET_NAME}' \\"
    echo "    --secret-string '{\"GMAIL_CLIENT_ID\":\"...\",\"GMAIL_CLIENT_SECRET\":\"...\",\"GMAIL_REFRESH_TOKEN\":\"...\",\"NOTION_API_KEY\":\"...\",\"TELEGRAM_BOT_TOKEN\":\"...\"}' \\"
    echo "    --region '${REGION}'"
    echo ""
    return 1
  fi

  local SECRET_JSON
  SECRET_JSON=$(printf '{"GMAIL_CLIENT_ID":"%s","GMAIL_CLIENT_SECRET":"%s","GMAIL_REFRESH_TOKEN":"%s","NOTION_API_KEY":"%s","TELEGRAM_BOT_TOKEN":"%s"}' \
    "${GMAIL_CLIENT_ID}" "${GMAIL_CLIENT_SECRET}" "${GMAIL_REFRESH_TOKEN}" "${NOTION_API_KEY}" "${TELEGRAM_BOT_TOKEN}")

  aws secretsmanager create-secret \
    --name "${SECRET_NAME}" \
    --secret-string "${SECRET_JSON}" \
    --description "Gmail OAuth + Notion API + Telegram Bot credentials for email processor" \
    --region "${REGION}"

  log "Secret created successfully."
}

# ============================================================
# 8. CLOUDWATCH DASHBOARD
# ============================================================
create_dashboard() {
  log "Creating CloudWatch Dashboard: ${DASHBOARD_NAME}..."

  local DASHBOARD_BODY
  DASHBOARD_BODY=$(cat <<'DASH_EOF'
{
  "widgets": [
    {
      "type": "metric",
      "x": 0, "y": 0, "width": 12, "height": 6,
      "properties": {
        "title": "Lambda Invocations & Errors",
        "metrics": [
          ["AWS/Lambda", "Invocations", "FunctionName", "FUNC_NAME", {"stat": "Sum", "color": "#2ca02c"}],
          ["AWS/Lambda", "Errors", "FunctionName", "FUNC_NAME", {"stat": "Sum", "color": "#d62728"}],
          ["AWS/Lambda", "Throttles", "FunctionName", "FUNC_NAME", {"stat": "Sum", "color": "#ff7f0e"}]
        ],
        "period": 900,
        "region": "REGION_PH",
        "view": "timeSeries",
        "stacked": false
      }
    },
    {
      "type": "metric",
      "x": 12, "y": 0, "width": 12, "height": 6,
      "properties": {
        "title": "Lambda Duration P50 / P90 / P99",
        "metrics": [
          ["AWS/Lambda", "Duration", "FunctionName", "FUNC_NAME", {"stat": "p50", "label": "P50", "color": "#1f77b4"}],
          ["AWS/Lambda", "Duration", "FunctionName", "FUNC_NAME", {"stat": "p90", "label": "P90", "color": "#ff7f0e"}],
          ["AWS/Lambda", "Duration", "FunctionName", "FUNC_NAME", {"stat": "p99", "label": "P99", "color": "#d62728"}]
        ],
        "period": 900,
        "region": "REGION_PH",
        "view": "timeSeries",
        "stacked": false,
        "yAxis": {"left": {"label": "ms", "showUnits": false}}
      }
    },
    {
      "type": "metric",
      "x": 0, "y": 6, "width": 12, "height": 6,
      "properties": {
        "title": "DynamoDB Consumed Capacity",
        "metrics": [
          ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "DYNAMO_PH", {"stat": "Sum", "color": "#1f77b4"}],
          ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "DYNAMO_PH", {"stat": "Sum", "color": "#ff7f0e"}]
        ],
        "period": 900,
        "region": "REGION_PH",
        "view": "timeSeries",
        "stacked": false
      }
    },
    {
      "type": "metric",
      "x": 12, "y": 6, "width": 12, "height": 6,
      "properties": {
        "title": "Extra Lambdas — Invocations & Errors",
        "metrics": [
          ["AWS/Lambda", "Invocations", "FunctionName", "CANARY_PH", {"stat": "Sum", "label": "Canary Inv"}],
          ["AWS/Lambda", "Errors", "FunctionName", "CANARY_PH", {"stat": "Sum", "label": "Canary Err", "color": "#d62728"}],
          ["AWS/Lambda", "Invocations", "FunctionName", "WATCH_PH", {"stat": "Sum", "label": "Watch Inv"}],
          ["AWS/Lambda", "Errors", "FunctionName", "WATCH_PH", {"stat": "Sum", "label": "Watch Err", "color": "#e377c2"}],
          ["AWS/Lambda", "Invocations", "FunctionName", "STATS_PH", {"stat": "Sum", "label": "Stats Inv"}],
          ["AWS/Lambda", "Errors", "FunctionName", "STATS_PH", {"stat": "Sum", "label": "Stats Err", "color": "#bcbd22"}]
        ],
        "period": 86400,
        "region": "REGION_PH",
        "view": "timeSeries",
        "stacked": false
      }
    }
  ]
}
DASH_EOF
)

  # Replace placeholders with actual values
  DASHBOARD_BODY="${DASHBOARD_BODY//FUNC_NAME/${FUNCTION_NAME}}"
  DASHBOARD_BODY="${DASHBOARD_BODY//REGION_PH/${REGION}}"
  DASHBOARD_BODY="${DASHBOARD_BODY//DYNAMO_PH/${DYNAMO_TABLE}}"
  DASHBOARD_BODY="${DASHBOARD_BODY//CANARY_PH/${CANARY_FUNCTION_NAME}}"
  DASHBOARD_BODY="${DASHBOARD_BODY//WATCH_PH/${WATCH_RENEWAL_FUNCTION_NAME}}"
  DASHBOARD_BODY="${DASHBOARD_BODY//STATS_PH/${WEEKLY_STATS_FUNCTION_NAME}}"

  aws cloudwatch put-dashboard \
    --dashboard-name "${DASHBOARD_NAME}" \
    --dashboard-body "${DASHBOARD_BODY}" \
    --region "${REGION}"

  log "CloudWatch Dashboard created/updated: ${DASHBOARD_NAME}"
}

# ============================================================
# 9. CLOUDWATCH ALARMS + SNS TOPIC
# ============================================================
create_alarms() {
  local ACCOUNT_ID
  ACCOUNT_ID=$(get_account_id)

  log "Creating SNS topic: ${SNS_TOPIC_NAME}..."

  local SNS_TOPIC_ARN
  # create-topic is idempotent — returns existing ARN if topic exists
  SNS_TOPIC_ARN=$(aws sns create-topic \
    --name "${SNS_TOPIC_NAME}" \
    --region "${REGION}" \
    --query 'TopicArn' --output text)

  log "SNS topic ARN: ${SNS_TOPIC_ARN}"
  warn "Add email subscription manually: aws sns subscribe --topic-arn '${SNS_TOPIC_ARN}' --protocol email --notification-endpoint YOUR_EMAIL --region '${REGION}'"

  # ALARM 1: Lambda Errors > 3 in 15 minutes
  log "Creating alarm: ${FUNCTION_NAME}-errors..."
  aws cloudwatch put-metric-alarm \
    --alarm-name "${FUNCTION_NAME}-errors" \
    --alarm-description "Lambda errors > 3 in 15 min" \
    --namespace "AWS/Lambda" \
    --metric-name "Errors" \
    --dimensions "Name=FunctionName,Value=${FUNCTION_NAME}" \
    --statistic "Sum" \
    --period 900 \
    --evaluation-periods 1 \
    --threshold 3 \
    --comparison-operator "GreaterThanThreshold" \
    --alarm-actions "${SNS_TOPIC_ARN}" \
    --ok-actions "${SNS_TOPIC_ARN}" \
    --treat-missing-data "notBreaching" \
    --region "${REGION}"

  log "Alarm created: ${FUNCTION_NAME}-errors (>3 errors / 15 min)"

  # ALARM 2: Lambda Duration P90 > 60s
  log "Creating alarm: ${FUNCTION_NAME}-duration-p90..."
  aws cloudwatch put-metric-alarm \
    --alarm-name "${FUNCTION_NAME}-duration-p90" \
    --alarm-description "Lambda P90 duration > 60s" \
    --namespace "AWS/Lambda" \
    --metric-name "Duration" \
    --dimensions "Name=FunctionName,Value=${FUNCTION_NAME}" \
    --extended-statistic "p90" \
    --period 900 \
    --evaluation-periods 1 \
    --threshold 60000 \
    --comparison-operator "GreaterThanThreshold" \
    --alarm-actions "${SNS_TOPIC_ARN}" \
    --ok-actions "${SNS_TOPIC_ARN}" \
    --treat-missing-data "notBreaching" \
    --region "${REGION}"

  log "Alarm created: ${FUNCTION_NAME}-duration-p90 (>60s)"

  # ALARM 3: Lambda Throttles > 0
  log "Creating alarm: ${FUNCTION_NAME}-throttles..."
  aws cloudwatch put-metric-alarm \
    --alarm-name "${FUNCTION_NAME}-throttles" \
    --alarm-description "Lambda throttled invocations > 0" \
    --namespace "AWS/Lambda" \
    --metric-name "Throttles" \
    --dimensions "Name=FunctionName,Value=${FUNCTION_NAME}" \
    --statistic "Sum" \
    --period 900 \
    --evaluation-periods 1 \
    --threshold 0 \
    --comparison-operator "GreaterThanThreshold" \
    --alarm-actions "${SNS_TOPIC_ARN}" \
    --ok-actions "${SNS_TOPIC_ARN}" \
    --treat-missing-data "notBreaching" \
    --region "${REGION}"

  log "Alarm created: ${FUNCTION_NAME}-throttles (>0)"
  log "All 3 alarms configured."
}

# ============================================================
# 10. CANARY LAMBDA (Health Check)
# ============================================================
deploy_canary() {
  local ACCOUNT_ID
  ACCOUNT_ID=$(get_account_id)
  local ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
  local CANARY_HANDLER="canary.handler"
  local CANARY_MEMORY=256
  local CANARY_TIMEOUT=60
  local CANARY_RULE="${CANARY_FUNCTION_NAME}-schedule"

  log "Packaging canary Lambda: ${CANARY_FUNCTION_NAME}..."

  # Check that canary.mjs exists
  if [[ ! -f "${SCRIPT_DIR}/canary.mjs" ]]; then
    error "canary.mjs not found in ${SCRIPT_DIR}. Create it first."
    return 1
  fi

  local ZIP_FILE="/tmp/${CANARY_FUNCTION_NAME}.zip"
  # Include canary entry point + shared modules it may need
  (cd "${SCRIPT_DIR}" && zip -j "${ZIP_FILE}" canary.mjs secrets.mjs gmail.mjs telegram.mjs dynamo.mjs utils.mjs package.json)

  log "Deploying canary Lambda..."

  local ENV_VARS='{
    "Variables": {
      "S3_BUCKET": "'"${S3_BUCKET}"'",
      "DYNAMO_TABLE": "'"${DYNAMO_TABLE}"'",
      "TELEGRAM_CHAT_ID": "'"${TELEGRAM_CHAT_ID}"'",
      "SECRET_NAME": "'"${SECRET_NAME}"'",
      "MY_EMAIL": "'"${MY_EMAIL}"'"
    }
  }'

  if aws lambda get-function --function-name "${CANARY_FUNCTION_NAME}" --region "${REGION}" 2>/dev/null; then
    log "Canary Lambda exists. Updating code..."
    aws lambda update-function-code \
      --function-name "${CANARY_FUNCTION_NAME}" \
      --zip-file "fileb://${ZIP_FILE}" \
      --region "${REGION}"

    aws lambda wait function-updated --function-name "${CANARY_FUNCTION_NAME}" --region "${REGION}"

    log "Updating canary configuration..."
    aws lambda update-function-configuration \
      --function-name "${CANARY_FUNCTION_NAME}" \
      --runtime "${RUNTIME}" \
      --handler "${CANARY_HANDLER}" \
      --memory-size "${CANARY_MEMORY}" \
      --timeout "${CANARY_TIMEOUT}" \
      --environment "${ENV_VARS}" \
      --role "${ROLE_ARN}" \
      --region "${REGION}"

    aws lambda wait function-updated --function-name "${CANARY_FUNCTION_NAME}" --region "${REGION}"
  else
    log "Creating new canary Lambda..."
    local retries=0
    while ! aws lambda create-function \
      --function-name "${CANARY_FUNCTION_NAME}" \
      --runtime "${RUNTIME}" \
      --handler "${CANARY_HANDLER}" \
      --memory-size "${CANARY_MEMORY}" \
      --timeout "${CANARY_TIMEOUT}" \
      --role "${ROLE_ARN}" \
      --zip-file "fileb://${ZIP_FILE}" \
      --environment "${ENV_VARS}" \
      --region "${REGION}" 2>/dev/null; do
      retries=$((retries + 1))
      if [[ ${retries} -ge 5 ]]; then
        error "Failed to create canary Lambda after ${retries} retries."
        exit 1
      fi
      warn "IAM role not ready, retrying in 10s... (${retries}/5)"
      sleep 10
    done

    aws lambda wait function-active --function-name "${CANARY_FUNCTION_NAME}" --region "${REGION}"
  fi

  log "Canary Lambda deployed."

  # Set CloudWatch Logs retention
  aws logs put-retention-policy \
    --log-group-name "/aws/lambda/${CANARY_FUNCTION_NAME}" \
    --retention-in-days 30 \
    --region "${REGION}" 2>/dev/null || true

  rm -f "${ZIP_FILE}"

  # EventBridge rule — daily at 07:00 UTC
  log "Creating EventBridge rule: ${CANARY_RULE}..."
  aws events put-rule \
    --name "${CANARY_RULE}" \
    --schedule-expression "cron(0 7 * * ? *)" \
    --state ENABLED \
    --description "Daily health check canary for email processor (07:00 UTC)" \
    --region "${REGION}"

  local CANARY_ARN
  CANARY_ARN=$(aws lambda get-function \
    --function-name "${CANARY_FUNCTION_NAME}" \
    --region "${REGION}" \
    --query 'Configuration.FunctionArn' --output text)

  aws events put-targets \
    --rule "${CANARY_RULE}" \
    --targets "Id=canary-lambda,Arn=${CANARY_ARN},Input={\"source\":\"eventbridge-canary\"}" \
    --region "${REGION}"

  aws lambda add-permission \
    --function-name "${CANARY_FUNCTION_NAME}" \
    --statement-id "eventbridge-invoke-${CANARY_RULE}" \
    --action lambda:InvokeFunction \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/${CANARY_RULE}" \
    --region "${REGION}" 2>/dev/null || true

  log "Canary deployed: ${CANARY_FUNCTION_NAME} (daily @ 07:00 UTC)"
}

# ============================================================
# 11. WATCH RENEWAL LAMBDA (Gmail Push)
# ============================================================
deploy_watch_renewal() {
  local ACCOUNT_ID
  ACCOUNT_ID=$(get_account_id)
  local ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
  local WATCH_HANDLER="watch-renewal.handler"
  local WATCH_MEMORY=128
  local WATCH_TIMEOUT=30
  local WATCH_RULE="${WATCH_RENEWAL_FUNCTION_NAME}-schedule"

  log "Packaging watch renewal Lambda: ${WATCH_RENEWAL_FUNCTION_NAME}..."

  if [[ ! -f "${SCRIPT_DIR}/watch-renewal.mjs" ]]; then
    error "watch-renewal.mjs not found in ${SCRIPT_DIR}. Create it first."
    return 1
  fi

  local ZIP_FILE="/tmp/${WATCH_RENEWAL_FUNCTION_NAME}.zip"
  (cd "${SCRIPT_DIR}" && zip -j "${ZIP_FILE}" watch-renewal.mjs secrets.mjs gmail.mjs telegram.mjs utils.mjs package.json)

  log "Deploying watch renewal Lambda..."

  local GMAIL_PUBSUB_TOPIC="${GMAIL_PUBSUB_TOPIC:-}"

  local ENV_VARS='{
    "Variables": {
      "TELEGRAM_CHAT_ID": "'"${TELEGRAM_CHAT_ID}"'",
      "SECRET_NAME": "'"${SECRET_NAME}"'",
      "GMAIL_PUBSUB_TOPIC": "'"${GMAIL_PUBSUB_TOPIC}"'"
    }
  }'

  if aws lambda get-function --function-name "${WATCH_RENEWAL_FUNCTION_NAME}" --region "${REGION}" 2>/dev/null; then
    log "Watch renewal Lambda exists. Updating code..."
    aws lambda update-function-code \
      --function-name "${WATCH_RENEWAL_FUNCTION_NAME}" \
      --zip-file "fileb://${ZIP_FILE}" \
      --region "${REGION}"

    aws lambda wait function-updated --function-name "${WATCH_RENEWAL_FUNCTION_NAME}" --region "${REGION}"

    log "Updating watch renewal configuration..."
    aws lambda update-function-configuration \
      --function-name "${WATCH_RENEWAL_FUNCTION_NAME}" \
      --runtime "${RUNTIME}" \
      --handler "${WATCH_HANDLER}" \
      --memory-size "${WATCH_MEMORY}" \
      --timeout "${WATCH_TIMEOUT}" \
      --environment "${ENV_VARS}" \
      --role "${ROLE_ARN}" \
      --region "${REGION}"

    aws lambda wait function-updated --function-name "${WATCH_RENEWAL_FUNCTION_NAME}" --region "${REGION}"
  else
    log "Creating new watch renewal Lambda..."
    local retries=0
    while ! aws lambda create-function \
      --function-name "${WATCH_RENEWAL_FUNCTION_NAME}" \
      --runtime "${RUNTIME}" \
      --handler "${WATCH_HANDLER}" \
      --memory-size "${WATCH_MEMORY}" \
      --timeout "${WATCH_TIMEOUT}" \
      --role "${ROLE_ARN}" \
      --zip-file "fileb://${ZIP_FILE}" \
      --environment "${ENV_VARS}" \
      --region "${REGION}" 2>/dev/null; do
      retries=$((retries + 1))
      if [[ ${retries} -ge 5 ]]; then
        error "Failed to create watch renewal Lambda after ${retries} retries."
        exit 1
      fi
      warn "IAM role not ready, retrying in 10s... (${retries}/5)"
      sleep 10
    done

    aws lambda wait function-active --function-name "${WATCH_RENEWAL_FUNCTION_NAME}" --region "${REGION}"
  fi

  log "Watch renewal Lambda deployed."

  # Set CloudWatch Logs retention
  aws logs put-retention-policy \
    --log-group-name "/aws/lambda/${WATCH_RENEWAL_FUNCTION_NAME}" \
    --retention-in-days 30 \
    --region "${REGION}" 2>/dev/null || true

  rm -f "${ZIP_FILE}"

  # EventBridge rule — every 6 days
  log "Creating EventBridge rule: ${WATCH_RULE}..."
  aws events put-rule \
    --name "${WATCH_RULE}" \
    --schedule-expression "rate(6 days)" \
    --state ENABLED \
    --description "Gmail watch renewal every 6 days (watch expires after 7)" \
    --region "${REGION}"

  local WATCH_ARN
  WATCH_ARN=$(aws lambda get-function \
    --function-name "${WATCH_RENEWAL_FUNCTION_NAME}" \
    --region "${REGION}" \
    --query 'Configuration.FunctionArn' --output text)

  aws events put-targets \
    --rule "${WATCH_RULE}" \
    --targets "Id=watch-renewal-lambda,Arn=${WATCH_ARN},Input={\"source\":\"eventbridge-watch-renewal\"}" \
    --region "${REGION}"

  aws lambda add-permission \
    --function-name "${WATCH_RENEWAL_FUNCTION_NAME}" \
    --statement-id "eventbridge-invoke-${WATCH_RULE}" \
    --action lambda:InvokeFunction \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/${WATCH_RULE}" \
    --region "${REGION}" 2>/dev/null || true

  if [[ -z "${GMAIL_PUBSUB_TOPIC}" ]]; then
    warn "GMAIL_PUBSUB_TOPIC is empty. Set it after Google Cloud Pub/Sub setup:"
    warn "  aws lambda update-function-configuration --function-name '${WATCH_RENEWAL_FUNCTION_NAME}' --environment 'Variables={TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID},SECRET_NAME=${SECRET_NAME},GMAIL_PUBSUB_TOPIC=projects/YOUR_PROJECT/topics/YOUR_TOPIC}' --region '${REGION}'"
  fi

  log "Watch renewal deployed: ${WATCH_RENEWAL_FUNCTION_NAME} (every 6 days)"
}

# ============================================================
# 12. WEEKLY STATS LAMBDA
# ============================================================
deploy_weekly_stats() {
  local ACCOUNT_ID
  ACCOUNT_ID=$(get_account_id)
  local ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
  local STATS_HANDLER="weekly-stats.handler"
  local STATS_MEMORY=256
  local STATS_TIMEOUT=60
  local STATS_RULE="${WEEKLY_STATS_FUNCTION_NAME}-schedule"

  log "Packaging weekly stats Lambda: ${WEEKLY_STATS_FUNCTION_NAME}..."

  if [[ ! -f "${SCRIPT_DIR}/weekly-stats.mjs" ]]; then
    error "weekly-stats.mjs not found in ${SCRIPT_DIR}. Create it first."
    return 1
  fi

  local ZIP_FILE="/tmp/${WEEKLY_STATS_FUNCTION_NAME}.zip"
  (cd "${SCRIPT_DIR}" && zip -j "${ZIP_FILE}" weekly-stats.mjs secrets.mjs gmail.mjs telegram.mjs dynamo.mjs utils.mjs package.json)

  log "Deploying weekly stats Lambda..."

  local ENV_VARS='{
    "Variables": {
      "S3_BUCKET": "'"${S3_BUCKET}"'",
      "DYNAMO_TABLE": "'"${DYNAMO_TABLE}"'",
      "TELEGRAM_CHAT_ID": "'"${TELEGRAM_CHAT_ID}"'",
      "SECRET_NAME": "'"${SECRET_NAME}"'",
      "MY_EMAIL": "'"${MY_EMAIL}"'",
      "FUNCTION_NAME": "'"${FUNCTION_NAME}"'"
    }
  }'

  if aws lambda get-function --function-name "${WEEKLY_STATS_FUNCTION_NAME}" --region "${REGION}" 2>/dev/null; then
    log "Weekly stats Lambda exists. Updating code..."
    aws lambda update-function-code \
      --function-name "${WEEKLY_STATS_FUNCTION_NAME}" \
      --zip-file "fileb://${ZIP_FILE}" \
      --region "${REGION}"

    aws lambda wait function-updated --function-name "${WEEKLY_STATS_FUNCTION_NAME}" --region "${REGION}"

    log "Updating weekly stats configuration..."
    aws lambda update-function-configuration \
      --function-name "${WEEKLY_STATS_FUNCTION_NAME}" \
      --runtime "${RUNTIME}" \
      --handler "${STATS_HANDLER}" \
      --memory-size "${STATS_MEMORY}" \
      --timeout "${STATS_TIMEOUT}" \
      --environment "${ENV_VARS}" \
      --role "${ROLE_ARN}" \
      --region "${REGION}"

    aws lambda wait function-updated --function-name "${WEEKLY_STATS_FUNCTION_NAME}" --region "${REGION}"
  else
    log "Creating new weekly stats Lambda..."
    local retries=0
    while ! aws lambda create-function \
      --function-name "${WEEKLY_STATS_FUNCTION_NAME}" \
      --runtime "${RUNTIME}" \
      --handler "${STATS_HANDLER}" \
      --memory-size "${STATS_MEMORY}" \
      --timeout "${STATS_TIMEOUT}" \
      --role "${ROLE_ARN}" \
      --zip-file "fileb://${ZIP_FILE}" \
      --environment "${ENV_VARS}" \
      --region "${REGION}" 2>/dev/null; do
      retries=$((retries + 1))
      if [[ ${retries} -ge 5 ]]; then
        error "Failed to create weekly stats Lambda after ${retries} retries."
        exit 1
      fi
      warn "IAM role not ready, retrying in 10s... (${retries}/5)"
      sleep 10
    done

    aws lambda wait function-active --function-name "${WEEKLY_STATS_FUNCTION_NAME}" --region "${REGION}"
  fi

  log "Weekly stats Lambda deployed."

  # Set CloudWatch Logs retention
  aws logs put-retention-policy \
    --log-group-name "/aws/lambda/${WEEKLY_STATS_FUNCTION_NAME}" \
    --retention-in-days 30 \
    --region "${REGION}" 2>/dev/null || true

  rm -f "${ZIP_FILE}"

  # EventBridge rule — every Friday at 08:00 UTC
  log "Creating EventBridge rule: ${STATS_RULE}..."
  aws events put-rule \
    --name "${STATS_RULE}" \
    --schedule-expression "cron(0 8 ? * FRI *)" \
    --state ENABLED \
    --description "Weekly stats report every Friday at 08:00 UTC" \
    --region "${REGION}"

  local STATS_ARN
  STATS_ARN=$(aws lambda get-function \
    --function-name "${WEEKLY_STATS_FUNCTION_NAME}" \
    --region "${REGION}" \
    --query 'Configuration.FunctionArn' --output text)

  aws events put-targets \
    --rule "${STATS_RULE}" \
    --targets "Id=weekly-stats-lambda,Arn=${STATS_ARN},Input={\"source\":\"eventbridge-weekly-stats\"}" \
    --region "${REGION}"

  aws lambda add-permission \
    --function-name "${WEEKLY_STATS_FUNCTION_NAME}" \
    --statement-id "eventbridge-invoke-${STATS_RULE}" \
    --action lambda:InvokeFunction \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/${STATS_RULE}" \
    --region "${REGION}" 2>/dev/null || true

  log "Weekly stats deployed: ${WEEKLY_STATS_FUNCTION_NAME} (Fridays @ 08:00 UTC)"
}

# ============================================================
# 13. UPDATE IAM — Extra CloudWatch Logs permissions for extra Lambdas
# ============================================================
update_iam_for_extras() {
  local ACCOUNT_ID
  ACCOUNT_ID=$(get_account_id)

  log "Updating IAM role with extra Lambda log groups..."

  local EXTRA_POLICY='{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "ExtraLambdaLogs",
        "Effect": "Allow",
        "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        "Resource": [
          "arn:aws:logs:'"${REGION}"':'"${ACCOUNT_ID}"':log-group:/aws/lambda/'"${CANARY_FUNCTION_NAME}"':*",
          "arn:aws:logs:'"${REGION}"':'"${ACCOUNT_ID}"':log-group:/aws/lambda/'"${WATCH_RENEWAL_FUNCTION_NAME}"':*",
          "arn:aws:logs:'"${REGION}"':'"${ACCOUNT_ID}"':log-group:/aws/lambda/'"${WEEKLY_STATS_FUNCTION_NAME}"':*"
        ]
      },
      {
        "Sid": "CloudWatchMetricsRead",
        "Effect": "Allow",
        "Action": ["cloudwatch:GetMetricData", "cloudwatch:GetMetricStatistics"],
        "Resource": "*"
      }
    ]
  }'

  aws iam put-role-policy \
    --role-name "${ROLE_NAME}" \
    --policy-name "${FUNCTION_NAME}-extras-policy" \
    --policy-document "${EXTRA_POLICY}"

  log "IAM extras policy attached."
}

# ============================================================
# MAIN — Dispatch by command
# ============================================================
main() {
  local CMD="${1:-full}"

  case "${CMD}" in
    full)
      log "=== FULL DEPLOYMENT ==="
      log "Region: ${REGION}"
      log "Account: $(get_account_id)"
      echo ""

      create_s3_bucket
      sync_knowledge_base
      create_dynamo_table
      create_iam_role
      create_lambda
      create_api_gateway
      create_eventbridge_rule

      echo ""
      log "=== DEPLOYMENT COMPLETE ==="
      echo ""
      echo "Next steps:"
      echo "  1. Create Secrets Manager secret (if not done): ./deploy.sh create-secret"
      echo "  2. Enable Bedrock model access in us-east-1 (AWS Console -> Bedrock -> Model access)"
      echo "  3. Set up Gmail Push Notifications (Google Cloud Console -> Pub/Sub)"
      echo "  4. Test: Send an email to ${MY_EMAIL} and check CloudWatch Logs + Telegram"
      echo "  5. Deploy extras (dashboard, alarms, canary, watch renewal, weekly stats): ./deploy.sh extras"
      echo ""
      ;;

    update-code)
      log "=== UPDATE CODE ONLY ==="
      create_lambda
      log "=== CODE UPDATE COMPLETE ==="
      ;;

    sync-kb)
      log "=== SYNC KNOWLEDGE BASE ==="
      sync_knowledge_base
      log "=== SYNC COMPLETE ==="
      ;;

    create-secret)
      create_secret
      ;;

    dashboard)
      log "=== DASHBOARD + ALARMS ==="
      create_dashboard
      create_alarms
      log "=== DASHBOARD + ALARMS COMPLETE ==="
      ;;

    canary)
      log "=== DEPLOY CANARY ==="
      update_iam_for_extras
      deploy_canary
      log "=== CANARY DEPLOY COMPLETE ==="
      ;;

    watch-renewal)
      log "=== DEPLOY WATCH RENEWAL ==="
      update_iam_for_extras
      deploy_watch_renewal
      log "=== WATCH RENEWAL DEPLOY COMPLETE ==="
      ;;

    weekly-stats)
      log "=== DEPLOY WEEKLY STATS ==="
      update_iam_for_extras
      deploy_weekly_stats
      log "=== WEEKLY STATS DEPLOY COMPLETE ==="
      ;;

    extras)
      log "=== DEPLOY ALL EXTRAS ==="
      log "Region: ${REGION}"
      log "Account: $(get_account_id)"
      echo ""

      update_iam_for_extras
      create_dashboard
      create_alarms
      deploy_canary
      deploy_watch_renewal
      deploy_weekly_stats

      echo ""
      log "=== ALL EXTRAS DEPLOYED ==="
      echo ""
      echo "Extras deployed:"
      echo "  - CloudWatch Dashboard: ${DASHBOARD_NAME}"
      echo "  - CloudWatch Alarms: 3 alarms -> SNS ${SNS_TOPIC_NAME}"
      echo "  - Canary Lambda: ${CANARY_FUNCTION_NAME} (daily @ 07:00 UTC)"
      echo "  - Watch Renewal: ${WATCH_RENEWAL_FUNCTION_NAME} (every 6 days)"
      echo "  - Weekly Stats: ${WEEKLY_STATS_FUNCTION_NAME} (Fridays @ 08:00 UTC)"
      echo ""
      echo "Manual steps:"
      echo "  1. Add email to SNS: aws sns subscribe --topic-arn arn:aws:sns:${REGION}:ACCOUNT_ID:${SNS_TOPIC_NAME} --protocol email --notification-endpoint YOUR_EMAIL --region ${REGION}"
      echo "  2. Set GMAIL_PUBSUB_TOPIC for watch-renewal Lambda (after Google Cloud Pub/Sub setup)"
      echo ""
      ;;

    *)
      echo "Usage: $0 [full|update-code|sync-kb|create-secret|dashboard|canary|watch-renewal|weekly-stats|extras]"
      exit 1
      ;;
  esac
}

main "$@"
