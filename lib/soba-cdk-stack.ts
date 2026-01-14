import * as cdk from 'aws-cdk-lib/core';
import { AaaaRecord, ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Distribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin, S3StaticWebsiteOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Certificate, CertificateValidation, DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import HostedZoneStack from './hosted-zone';
import DynamoDBStack from './dynamodb';
import SecretsStack from './secrets';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SobaCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'SobaCdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    const hostedZoneStack = new HostedZoneStack(this, 'HostedZoneStack');
    const hostedZone = hostedZoneStack.hostedZone;

    // S3 bucket for website
    const websiteBucket = new Bucket(this, 'ServicesWebsiteBucket', {
      accessControl: BucketAccessControl.PRIVATE,
    });

    // Deploy static website assets into bucket
    const websiteBucketDeployment = new BucketDeployment(this, 'ServicesWebsiteBucketDeployment', {
      sources: [Source.asset('./assets/services-website/build/client')],
      destinationBucket: websiteBucket
    });

    // Certificate for CloudFront distribution
    // DnsValidatedCertificate is used since we need the certificate to be created in us-east-1 for CloudFront to use it,
    // despite the construct's deprecation.
    const certificate = new DnsValidatedCertificate(this, 'ServicesWebsiteCertificate', {
      domainName: 'services.seattleoba.org',
      hostedZone: hostedZone,
      region: 'us-east-1'
    });

    // Create CloudFront disctribution
    const servicesWebsiteDistribution = new Distribution(this, 'ServicesWebsiteCloudFrontDistribution', {
      certificate: certificate,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(websiteBucket)
      },
      domainNames: ['services.seattleoba.org']
    });

    new AaaaRecord(this, 'ServicesWebsiteAAAARecord', {
      zone: hostedZone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(servicesWebsiteDistribution))
    });
    new ARecord(this, 'ServicesWebsiteARecord', {
      zone: hostedZone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(servicesWebsiteDistribution))
    });

    const dynamoDbStack = new DynamoDBStack(this, 'DynamoDBStack');
    const secretsStack = new SecretsStack(this, 'SecretsStack');
  }
}
