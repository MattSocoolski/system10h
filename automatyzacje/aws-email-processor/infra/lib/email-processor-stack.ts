import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

// ─── Stack props (multi-tenant) ──────────────────────────────────────
export interface EmailProcessorStackProps extends cdk.StackProps {
  /** Tenant identifier, used to prefix all resource names (e.g. 'artnapi') */
  tenantId: string;
  /** Email address monitored by the processor */
  email: string;
  /** AWS region for deployment */
  region: string;
  /** Secrets Manager secret name (path) */
  secretName: string;
  /** Telegram chat ID for alerts */
  telegramChatId: string;
  /** Notion CRM datasource ID */
  notionDatasourceId: string;
  /** Anthropic model ID — default: 'claude-sonnet-4-6' */
  anthropicModelId?: string;
  /** Daily AI invocation cap — default: 50 */
  dailyAiCap?: number;
  /** Draft frequency cap per 24h — default: 3 */
  draftFrequencyCap?: number;
}

export class EmailProcessorStack extends cdk.Stack {
  /** Webhook URL output */
  public readonly webhookUrl: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: EmailProcessorStackProps) {
    super(scope, id, props);

    const tenant = props.tenantId;
    const anthropicModelId = props.anthropicModelId ?? 'claude-sonnet-4-6';
    const dailyAiCap = props.dailyAiCap ?? 50;
    const draftFrequencyCap = props.draftFrequencyCap ?? 3;

    // Path to the Lambda source directory (one level up from infra/)
    const lambdaSrcDir = path.resolve(__dirname, '..', '..');

    // ================================================================
    // 1. S3 BUCKET — Knowledge Base
    // ================================================================
    const kbBucket = new s3.Bucket(this, 'KnowledgeBaseBucket', {
      bucketName: `${tenant}-email-processor-kb`,
      encryption: s3.BucketEncryption.S3_MANAGED, // SSE-S3 (AES256)
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ================================================================
    // 2. DYNAMODB TABLE — State
    // ================================================================
    const stateTable = new dynamodb.Table(this, 'StateTable', {
      tableName: `${tenant}-email-processor-state`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ================================================================
    // 3. IAM ROLE — Lambda execution (shared by all Lambdas)
    // ================================================================
    const executionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${tenant}-email-processor-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Execution role for ${tenant} Email Processor Lambdas`,
    });

    // CloudWatch Logs — all Lambda log groups
    const mainFnName = `${tenant}-email-processor`;
    const canaryFnName = `${tenant}-email-processor-canary`;
    const watchFnName = `${tenant}-gmail-watch-renewal`;
    const statsFnName = `${tenant}-email-processor-stats`;

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudWatchLogs',
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:aws:logs:${props.region}:${this.account}:log-group:/aws/lambda/${mainFnName}:*`,
          `arn:aws:logs:${props.region}:${this.account}:log-group:/aws/lambda/${canaryFnName}:*`,
          `arn:aws:logs:${props.region}:${this.account}:log-group:/aws/lambda/${watchFnName}:*`,
          `arn:aws:logs:${props.region}:${this.account}:log-group:/aws/lambda/${statsFnName}:*`,
        ],
      }),
    );

    // S3 — read knowledge base
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3KnowledgeBaseRead',
        actions: ['s3:GetObject', 's3:HeadObject'],
        resources: [kbBucket.arnForObjects('*')],
      }),
    );

    // DynamoDB — CRUD
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'DynamoDBState',
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
        ],
        resources: [stateTable.tableArn],
      }),
    );

    // Secrets Manager — read credentials
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'SecretsManagerRead',
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          `arn:aws:secretsmanager:${props.region}:${this.account}:secret:${tenant}-email-processor/*`,
        ],
      }),
    );

    // Bedrock — invoke model (kept for backward compat, deploy.sh has it)
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'BedrockInvoke',
        actions: ['bedrock:InvokeModel'],
        resources: [
          'arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-6*',
          `arn:aws:bedrock:*:${this.account}:inference-profile/eu.anthropic.claude-sonnet-4-6*`,
        ],
      }),
    );

    // CloudWatch Metrics — read (for weekly stats Lambda)
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudWatchMetricsRead',
        actions: [
          'cloudwatch:GetMetricData',
          'cloudwatch:GetMetricStatistics',
        ],
        resources: ['*'],
      }),
    );

    // ================================================================
    // 4. MAIN LAMBDA — email processor
    // ================================================================
    const mainLambda = new lambda.Function(this, 'MainLambda', {
      functionName: mainFnName,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(180),
      role: executionRole,
      code: lambda.Code.fromAsset(lambdaSrcDir, {
        exclude: ['infra', 'infra/**', 'deploy.sh', 'setup-pubsub.mjs', 'node_modules', '.git'],
      }),
      environment: {
        S3_BUCKET: kbBucket.bucketName,
        DYNAMO_TABLE: stateTable.tableName,
        TELEGRAM_CHAT_ID: props.telegramChatId,
        NOTION_CRM_DATASOURCE_ID: props.notionDatasourceId,
        ANTHROPIC_MODEL_ID: anthropicModelId,
        MY_EMAIL: props.email,
        SECRET_NAME: props.secretName,
        DAILY_AI_CAP: String(dailyAiCap),
        DRAFT_FREQUENCY_CAP_24H: String(draftFrequencyCap),
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // ================================================================
    // 5. API GATEWAY (HTTP API v2) — webhook endpoint
    // ================================================================
    const httpApi = new apigatewayv2.HttpApi(this, 'WebhookApi', {
      apiName: `${tenant}-email-processor-webhook`,
      description: `Webhook endpoint for ${tenant} email processor`,
    });

    // Throttling on default stage
    const defaultStage = httpApi.defaultStage?.node
      .defaultChild as apigatewayv2.CfnStage;
    if (defaultStage) {
      defaultStage.defaultRouteSettings = {
        throttlingBurstLimit: 20,
        throttlingRateLimit: 10,
      };
    }

    // POST /webhook -> Main Lambda
    httpApi.addRoutes({
      path: '/webhook',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2Integrations.HttpLambdaIntegration(
        'WebhookIntegration',
        mainLambda,
      ),
    });

    // ================================================================
    // 6. EVENTBRIDGE — 15-min fallback polling
    // ================================================================
    const fallbackRule = new events.Rule(this, 'FallbackRule', {
      ruleName: `${tenant}-email-processor-fallback`,
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
      description:
        'Fallback polling for email processor (in case Gmail Push fails)',
    });

    fallbackRule.addTarget(
      new eventsTargets.LambdaFunction(mainLambda, {
        event: events.RuleTargetInput.fromObject({
          source: 'eventbridge-fallback',
        }),
      }),
    );

    // ================================================================
    // 7. CANARY LAMBDA — daily health check
    // ================================================================
    const canaryLambda = new lambda.Function(this, 'CanaryLambda', {
      functionName: canaryFnName,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'canary.handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(60),
      role: executionRole,
      code: lambda.Code.fromAsset(lambdaSrcDir, {
        exclude: [
          'infra', 'infra/**', 'deploy.sh', 'setup-pubsub.mjs',
          'index.mjs', 'bedrock.mjs', 'weekly-stats.mjs',
          'watch-renewal.mjs', 'gdpr-delete.mjs',
          'node_modules', '.git',
        ],
      }),
      environment: {
        S3_BUCKET: kbBucket.bucketName,
        DYNAMO_TABLE: stateTable.tableName,
        TELEGRAM_CHAT_ID: props.telegramChatId,
        SECRET_NAME: props.secretName,
        MY_EMAIL: props.email,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    const canarySchedule = new events.Rule(this, 'CanarySchedule', {
      ruleName: `${canaryFnName}-schedule`,
      schedule: events.Schedule.cron({ minute: '0', hour: '7' }), // daily 07:00 UTC
      description: 'Daily health check canary for email processor (07:00 UTC)',
    });

    canarySchedule.addTarget(
      new eventsTargets.LambdaFunction(canaryLambda, {
        event: events.RuleTargetInput.fromObject({
          source: 'eventbridge-canary',
        }),
      }),
    );

    // ================================================================
    // 8. WATCH RENEWAL LAMBDA — Gmail watch renewal
    // ================================================================
    const watchRenewalLambda = new lambda.Function(this, 'WatchRenewalLambda', {
      functionName: watchFnName,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'watch-renewal.handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
      role: executionRole,
      code: lambda.Code.fromAsset(lambdaSrcDir, {
        exclude: [
          'infra', 'infra/**', 'deploy.sh', 'setup-pubsub.mjs',
          'index.mjs', 'bedrock.mjs', 'weekly-stats.mjs',
          'canary.mjs', 'dynamo.mjs', 's3.mjs', 'notion.mjs',
          'gdpr-delete.mjs', 'node_modules', '.git',
        ],
      }),
      environment: {
        TELEGRAM_CHAT_ID: props.telegramChatId,
        SECRET_NAME: props.secretName,
        GMAIL_PUBSUB_TOPIC: '', // Set after Google Cloud Pub/Sub setup
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    const watchSchedule = new events.Rule(this, 'WatchRenewalSchedule', {
      ruleName: `${watchFnName}-schedule`,
      schedule: events.Schedule.rate(cdk.Duration.days(6)),
      description: 'Gmail watch renewal every 6 days (watch expires after 7)',
    });

    watchSchedule.addTarget(
      new eventsTargets.LambdaFunction(watchRenewalLambda, {
        event: events.RuleTargetInput.fromObject({
          source: 'eventbridge-watch-renewal',
        }),
      }),
    );

    // ================================================================
    // 9. WEEKLY STATS LAMBDA — Friday report
    // ================================================================
    const weeklyStatsLambda = new lambda.Function(this, 'WeeklyStatsLambda', {
      functionName: statsFnName,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'weekly-stats.handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(60),
      role: executionRole,
      code: lambda.Code.fromAsset(lambdaSrcDir, {
        exclude: [
          'infra', 'infra/**', 'deploy.sh', 'setup-pubsub.mjs',
          'index.mjs', 'bedrock.mjs', 'canary.mjs',
          'watch-renewal.mjs', 'gdpr-delete.mjs', 'notion.mjs',
          'node_modules', '.git',
        ],
      }),
      environment: {
        S3_BUCKET: kbBucket.bucketName,
        DYNAMO_TABLE: stateTable.tableName,
        TELEGRAM_CHAT_ID: props.telegramChatId,
        SECRET_NAME: props.secretName,
        MY_EMAIL: props.email,
        FUNCTION_NAME: mainFnName,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    const statsSchedule = new events.Rule(this, 'WeeklyStatsSchedule', {
      ruleName: `${statsFnName}-schedule`,
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '8',
        weekDay: 'FRI',
      }), // Fridays at 08:00 UTC
      description: 'Weekly stats report every Friday at 08:00 UTC',
    });

    statsSchedule.addTarget(
      new eventsTargets.LambdaFunction(weeklyStatsLambda, {
        event: events.RuleTargetInput.fromObject({
          source: 'eventbridge-weekly-stats',
        }),
      }),
    );

    // ================================================================
    // 10. SNS TOPIC — alerts
    // ================================================================
    const alertsTopic = new sns.Topic(this, 'AlertsTopic', {
      topicName: `${tenant}-email-processor-alerts`,
      displayName: `${tenant} Email Processor Alerts`,
    });

    // ================================================================
    // 11. CLOUDWATCH ALARMS
    // ================================================================

    // Alarm 1: Lambda Errors > 3 in 15 min
    const errorsAlarm = new cloudwatch.Alarm(this, 'ErrorsAlarm', {
      alarmName: `${mainFnName}-errors`,
      alarmDescription: 'Lambda errors > 3 in 15 min',
      metric: mainLambda.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(15),
      }),
      threshold: 3,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    errorsAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));
    errorsAlarm.addOkAction(new cloudwatchActions.SnsAction(alertsTopic));

    // Alarm 2: Lambda Duration P90 > 60s
    const durationAlarm = new cloudwatch.Alarm(this, 'DurationP90Alarm', {
      alarmName: `${mainFnName}-duration-p90`,
      alarmDescription: 'Lambda P90 duration > 60s',
      metric: mainLambda.metricDuration({
        statistic: 'p90',
        period: cdk.Duration.minutes(15),
      }),
      threshold: 60_000, // milliseconds
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    durationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));
    durationAlarm.addOkAction(new cloudwatchActions.SnsAction(alertsTopic));

    // Alarm 3: Lambda Throttles > 0
    const throttlesAlarm = new cloudwatch.Alarm(this, 'ThrottlesAlarm', {
      alarmName: `${mainFnName}-throttles`,
      alarmDescription: 'Lambda throttled invocations > 0',
      metric: mainLambda.metricThrottles({
        statistic: 'Sum',
        period: cdk.Duration.minutes(15),
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    throttlesAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));
    throttlesAlarm.addOkAction(new cloudwatchActions.SnsAction(alertsTopic));

    // Alarm 4: Zero invocations for 1 hour (breaching when missing)
    const zeroInvocationsAlarm = new cloudwatch.Alarm(
      this,
      'ZeroInvocationsAlarm',
      {
        alarmName: `${mainFnName}-zero-invocations`,
        alarmDescription: 'Zero Lambda invocations for 1 hour',
        metric: mainLambda.metricInvocations({
          statistic: 'Sum',
          period: cdk.Duration.hours(1),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      },
    );
    zeroInvocationsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertsTopic),
    );
    zeroInvocationsAlarm.addOkAction(
      new cloudwatchActions.SnsAction(alertsTopic),
    );

    // ================================================================
    // 12. CLOUDWATCH DASHBOARD
    // ================================================================
    new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `${tenant}-email-processor`,
      widgets: [
        // Row 1: Main Lambda invocations/errors + duration
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Invocations & Errors',
            width: 12,
            height: 6,
            left: [
              mainLambda.metricInvocations({ statistic: 'Sum', period: cdk.Duration.minutes(15) }),
              mainLambda.metricErrors({ statistic: 'Sum', period: cdk.Duration.minutes(15) }),
              mainLambda.metricThrottles({ statistic: 'Sum', period: cdk.Duration.minutes(15) }),
            ],
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Duration P50 / P90 / P99',
            width: 12,
            height: 6,
            left: [
              mainLambda.metricDuration({ statistic: 'p50', label: 'P50', period: cdk.Duration.minutes(15) }),
              mainLambda.metricDuration({ statistic: 'p90', label: 'P90', period: cdk.Duration.minutes(15) }),
              mainLambda.metricDuration({ statistic: 'p99', label: 'P99', period: cdk.Duration.minutes(15) }),
            ],
          }),
        ],
        // Row 2: DynamoDB capacity + extra Lambdas
        [
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Consumed Capacity',
            width: 12,
            height: 6,
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedReadCapacityUnits',
                dimensionsMap: { TableName: stateTable.tableName },
                statistic: 'Sum',
                period: cdk.Duration.minutes(15),
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedWriteCapacityUnits',
                dimensionsMap: { TableName: stateTable.tableName },
                statistic: 'Sum',
                period: cdk.Duration.minutes(15),
              }),
            ],
          }),
          new cloudwatch.GraphWidget({
            title: 'Extra Lambdas - Invocations & Errors',
            width: 12,
            height: 6,
            left: [
              canaryLambda.metricInvocations({ statistic: 'Sum', label: 'Canary Inv', period: cdk.Duration.days(1) }),
              canaryLambda.metricErrors({ statistic: 'Sum', label: 'Canary Err', period: cdk.Duration.days(1) }),
              watchRenewalLambda.metricInvocations({ statistic: 'Sum', label: 'Watch Inv', period: cdk.Duration.days(1) }),
              watchRenewalLambda.metricErrors({ statistic: 'Sum', label: 'Watch Err', period: cdk.Duration.days(1) }),
              weeklyStatsLambda.metricInvocations({ statistic: 'Sum', label: 'Stats Inv', period: cdk.Duration.days(1) }),
              weeklyStatsLambda.metricErrors({ statistic: 'Sum', label: 'Stats Err', period: cdk.Duration.days(1) }),
            ],
          }),
        ],
      ],
    });

    // ================================================================
    // OUTPUTS
    // ================================================================
    this.webhookUrl = new cdk.CfnOutput(this, 'WebhookUrl', {
      value: `${httpApi.apiEndpoint}/webhook`,
      description: 'Gmail Push webhook URL',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: kbBucket.bucketName,
      description: 'Knowledge base S3 bucket',
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: stateTable.tableName,
      description: 'State DynamoDB table',
    });

    new cdk.CfnOutput(this, 'SnsTopicArn', {
      value: alertsTopic.topicArn,
      description: 'SNS alerts topic ARN — subscribe your email',
    });

    new cdk.CfnOutput(this, 'MainLambdaArn', {
      value: mainLambda.functionArn,
      description: 'Main email processor Lambda ARN',
    });
  }
}
