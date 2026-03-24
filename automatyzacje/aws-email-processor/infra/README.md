# Email Processor — AWS CDK Infrastructure

Replaces `deploy.sh` with repeatable, multi-tenant AWS CDK (TypeScript) deployments.

## Prerequisites

- **Node.js** >= 18
- **AWS CDK CLI** (`npm install -g aws-cdk`)
- **AWS CLI v2** configured with credentials that have permissions for Lambda, S3, DynamoDB, IAM, API Gateway, EventBridge, Secrets Manager, Bedrock, CloudWatch, SNS
- Secrets Manager secret already created (see deploy.sh `create-secret` or create manually)

## Setup

```bash
cd infra/
npm install
```

## Deploy a tenant

### First-time bootstrap (once per account/region)

```bash
cdk bootstrap aws://ACCOUNT_ID/eu-north-1
```

### Deploy the artnapi tenant (current production)

```bash
cdk deploy EmailProcessor-artnapi
```

### Deploy a new tenant

1. Edit `bin/app.ts` — add a new `EmailProcessorStack` instance with the tenant's config.
2. Bootstrap the target region if needed: `cdk bootstrap aws://ACCOUNT_ID/REGION`
3. Deploy:

```bash
cdk deploy EmailProcessor-<tenantId>
```

### What gets created

| Resource | Name pattern |
|----------|-------------|
| S3 Bucket | `<tenantId>-email-processor-kb` |
| DynamoDB Table | `<tenantId>-email-processor-state` |
| IAM Role | `<tenantId>-email-processor-role` |
| Main Lambda | `<tenantId>-email-processor` |
| Canary Lambda | `<tenantId>-email-processor-canary` |
| Watch Renewal Lambda | `<tenantId>-gmail-watch-renewal` |
| Weekly Stats Lambda | `<tenantId>-email-processor-stats` |
| HTTP API | `<tenantId>-email-processor-webhook` |
| EventBridge Rules | fallback (15 min), canary (daily 07:00), watch (6 days), stats (Fri 08:00) |
| SNS Topic | `<tenantId>-email-processor-alerts` |
| CloudWatch Alarms | errors, duration-p90, throttles, zero-invocations |
| CloudWatch Dashboard | `<tenantId>-email-processor` |

## Update existing tenant

After changing Lambda code (the .mjs files in the parent directory):

```bash
cdk deploy EmailProcessor-artnapi
```

CDK detects the asset hash change and updates the Lambda code automatically.

## Preview changes before deploying

```bash
cdk diff EmailProcessor-artnapi
```

## Destroy a tenant

```bash
cdk destroy EmailProcessor-artnapi
```

**Note:** S3 bucket and DynamoDB table have `RETAIN` removal policy. They will NOT be deleted on `cdk destroy` to prevent data loss. Delete them manually via AWS Console or CLI if needed.

## Post-deploy manual steps

1. **Subscribe to SNS alerts:**
   ```bash
   aws sns subscribe \
     --topic-arn <SnsTopicArn from output> \
     --protocol email \
     --notification-endpoint your@email.com \
     --region eu-north-1
   ```

2. **Set GMAIL_PUBSUB_TOPIC** (after Google Cloud Pub/Sub setup):
   ```bash
   aws lambda update-function-configuration \
     --function-name <tenantId>-gmail-watch-renewal \
     --environment 'Variables={TELEGRAM_CHAT_ID=...,SECRET_NAME=...,GMAIL_PUBSUB_TOPIC=projects/YOUR_PROJECT/topics/YOUR_TOPIC}' \
     --region eu-north-1
   ```

3. **Sync knowledge base to S3** (upload oferta.md, ghost_styl.md):
   ```bash
   aws s3 cp ../../dane/artnapi/oferta.md s3://<tenantId>-email-processor-kb/oferta.md --region eu-north-1
   aws s3 cp ../../dane/ghost_styl.md s3://<tenantId>-email-processor-kb/ghost_styl.md --region eu-north-1
   ```

## Stack props reference

| Prop | Required | Default | Description |
|------|----------|---------|-------------|
| `tenantId` | yes | — | Tenant identifier (e.g. `artnapi`) |
| `email` | yes | — | Monitored email address |
| `region` | yes | — | AWS region |
| `secretName` | yes | — | Secrets Manager secret path |
| `telegramChatId` | yes | — | Telegram chat ID for alerts |
| `notionDatasourceId` | yes | — | Notion CRM datasource ID |
| `anthropicModelId` | no | `claude-sonnet-4-6` | Anthropic model ID |
| `dailyAiCap` | no | `50` | Daily AI invocation cap |
| `draftFrequencyCap` | no | `3` | Draft frequency cap per 24h |
