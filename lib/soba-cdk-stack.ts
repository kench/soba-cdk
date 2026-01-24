import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import HostedZoneStack from './hosted-zone';
import DynamoDBStack from './dynamodb';
import SecretsStack from './secrets';
import S3Stack from './s3';
import { ServicesWebsiteStack } from './services-website';
import { LambdaStack } from './lambda';

export class SobaCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hostedZoneStack = new HostedZoneStack(this, 'HostedZoneStack');
    const hostedZone = hostedZoneStack.hostedZone;

    const dynamoDbStack = new DynamoDBStack(this, 'DynamoDBStack');
    const secretsStack = new SecretsStack(this, 'SecretsStack');
    const s3Stack = new S3Stack(this, 'S3Stack');
    const servicesWebsiteStack = new ServicesWebsiteStack(this, 'ServicesWebsiteStack', {
      hostedZone: hostedZone,
    });

    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      bevyTickets: dynamoDbStack.bevyTickets,
      twitchAccounts: dynamoDbStack.twitchAccounts,
      twitchAccountsBevyTickets: dynamoDbStack.twitchAccountsBevyTickets,
      twitchClientSecret: secretsStack.twitchClientSecret,
    })
  }
}
