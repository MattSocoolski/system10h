#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EmailProcessorStack } from '../lib/email-processor-stack';

const app = new cdk.App();

// ─── ArtNapi tenant (current production) ────────────────────────────
new EmailProcessorStack(app, 'EmailProcessor-artnapi', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-north-1',
  },

  tenantId: 'artnapi',
  email: 'mateusz.sokolski@artnapi.pl',
  region: 'eu-north-1',
  secretName: 'artnapi-email-processor/credentials',
  telegramChatId: '1304598782',
  notionDatasourceId: '26f862e1-4a0c-808f-a249-000b2cee31df',
  anthropicModelId: 'claude-sonnet-4-6',
  dailyAiCap: 50,
  draftFrequencyCap: 3,
});

// ─── Example: second tenant (uncomment to deploy) ───────────────────
// new EmailProcessorStack(app, 'EmailProcessor-acme', {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: 'eu-central-1',
//   },
//   tenantId: 'acme',
//   email: 'contact@acme.com',
//   region: 'eu-central-1',
//   secretName: 'acme-email-processor/credentials',
//   telegramChatId: '000000000',
//   notionDatasourceId: '00000000-0000-0000-0000-000000000000',
// });
