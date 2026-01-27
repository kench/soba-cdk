import { Duration, NestedStack } from "aws-cdk-lib";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Architecture, Code, Function, LayerVersion, MetricType, Runtime, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { TWITCH_API_CLIENT_ID } from "./constants";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { DynamoEventSource, SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { IQueue } from "aws-cdk-lib/aws-sqs";

const SECRETS_LAMBDA_EXTENSION_ARN = 'arn:aws:lambda:us-west-2:345057560386:layer:AWS-Parameters-and-Secrets-Lambda-Extension-Arm64:24';

interface LambdaStackProps {
  bevyFilesBucket: IBucket;
  bevyTickets: ITable;
  bevyTicketEventsQueue: IQueue;
  twitchAccounts: ITable;
  twitchAccountsBevyTickets: ITable;
  twitchClientSecret: ISecret;
}

export class LambdaStack extends NestedStack {
    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id);

        const lambdaCode = Code.fromAsset('./assets/data-lambda/app/build/distributions/app.zip');

        // AWS Lambda function that processes new records in the Bevy tickets table
        // This function queries the Twitch API for Twitch user information and populates
        // the DynamoDB tables containing account and ticket ownership information.
        const twitchAccountSyncFunction = new Function(this, 'TwitchAccountSync', {
            architecture: Architecture.ARM_64,
            runtime: Runtime.JAVA_21,
            timeout: Duration.seconds(10),
            memorySize: 512,
            handler: 'org.seattleoba.lambda.SQSEventRequestHandler',
            code: lambdaCode,
            layers: [LayerVersion.fromLayerVersionArn(this, 'SecretsLayer', SECRETS_LAMBDA_EXTENSION_ARN)],
            environment: {
                'CLIENT_ID': TWITCH_API_CLIENT_ID,
                'CLIENT_SECRET_ARN': props.twitchClientSecret.secretArn
            }
        });

        props.bevyTicketEventsQueue.grantConsumeMessages(twitchAccountSyncFunction);
        props.twitchAccounts.grantReadWriteData(twitchAccountSyncFunction);
        props.twitchAccountsBevyTickets.grantReadWriteData(twitchAccountSyncFunction);
        props.twitchClientSecret.grantRead(twitchAccountSyncFunction);

        twitchAccountSyncFunction.addEventSource(new SqsEventSource(props.bevyTicketEventsQueue, {
            batchSize: 10,
            maxBatchingWindow: Duration.minutes(5),
            maxConcurrency: 2,
            metricsConfig: {
                metrics: [MetricType.EVENT_COUNT]
            },
            reportBatchItemFailures: true
        }));

        // AWS Lambda function for sending Bevy Ticket DynamoDB table updates to SQS.
        const bevyTicketEventsFunction = new Function(this, 'BevyTicketEvents', {
            architecture: Architecture.ARM_64,
            runtime: Runtime.JAVA_21,
            timeout: Duration.seconds(10),
            memorySize: 512,
            handler: 'org.seattleoba.lambda.DynamoDbEventRequestHandler',
            code: lambdaCode,
            environment: {
                'SQS_QUEUE_URL': props.bevyTicketEventsQueue.queueUrl
            }
        });
        props.bevyTickets.grantStreamRead(bevyTicketEventsFunction);
        props.bevyTicketEventsQueue.grantSendMessages(bevyTicketEventsFunction);

        bevyTicketEventsFunction.addEventSource(new DynamoEventSource(props.bevyTickets, {
            batchSize: 100,
            startingPosition: StartingPosition.LATEST,
            maxBatchingWindow: Duration.minutes(5),
            metricsConfig: {
                metrics: [MetricType.EVENT_COUNT]
            },
            parallelizationFactor: 1,
            reportBatchItemFailures: true,
            retryAttempts: 2,
        }));

        // AWS Lambda function that ingests ticketing records from Bevy
        const bevyImportFunction = new Function(this, 'BevyRosterImport', {
            architecture: Architecture.ARM_64,
            runtime: Runtime.JAVA_21,
            timeout: Duration.seconds(60),
            memorySize: 512,
            handler: 'org.seattleoba.lambda.TicketImportRequestHandler',
            code: lambdaCode
        });
        props.bevyFilesBucket.grantRead(bevyImportFunction);
        props.bevyTickets.grantReadWriteData(bevyImportFunction);
    }
}