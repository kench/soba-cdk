import * as cdk from 'aws-cdk-lib/core';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SobaCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'SobaCdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // Route 53 hosted zone for delegation from SOBA Squarespace account
    const hostedZone = new HostedZone(this, 'SOBAHostedZone', {
      zoneName: 'services.seattleoba.org',
    });
    hostedZone.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);
  }
}
