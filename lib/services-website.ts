import { DnsValidatedCertificate, ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { Distribution } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { AaaaRecord, ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Bucket, BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { NestedStack } from "aws-cdk-lib/core"
import { Construct } from "constructs";

interface ServicesWebsiteStackProps {
    hostedZone: HostedZone,
}

export class ServicesWebsiteStack extends NestedStack {
    constructor(scope: Construct, id: string, props: ServicesWebsiteStackProps) {
        super(scope, id);

        // S3 bucket for website
        const websiteBucket = new Bucket(this, 'ServicesWebsiteBucket', {
          bucketName: 'soba-services-website',
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
          hostedZone: props.hostedZone,
          region: 'us-east-1'
        });

        // Create CloudFront disctribution
        const servicesWebsiteDistribution = new Distribution(this, 'ServicesWebsiteCloudFrontDistribution', {
          certificate: certificate,
          defaultRootObject: 'index.html',
          defaultBehavior: {
            origin: S3BucketOrigin.withOriginAccessControl(websiteBucket)
          },
          errorResponses: [
            {
              httpStatus: 403,
              responseHttpStatus: 200,
              responsePagePath: '/index.html'
            }
          ],
          domainNames: ['services.seattleoba.org']
        });

        new AaaaRecord(this, 'ServicesWebsiteAAAARecord', {
          zone: props.hostedZone,
          target: RecordTarget.fromAlias(new CloudFrontTarget(servicesWebsiteDistribution))
        });
        new ARecord(this, 'ServicesWebsiteARecord', {
          zone: props.hostedZone,
          target: RecordTarget.fromAlias(new CloudFrontTarget(servicesWebsiteDistribution))
        });
    }
}