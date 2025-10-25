#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PerplexityAlexaSkillStack } from './perplexity-alexa-skill-stack';

const app = new cdk.App();

new PerplexityAlexaSkillStack(app, 'PerplexityAlexaSkillStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'eu-central-1',
  },
  description: 'Infrastructure for Perplexity Alexa Skill',
});