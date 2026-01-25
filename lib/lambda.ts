import { Duration, NestedStack } from "aws-cdk-lib";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Architecture, Code, Function, LayerVersion, MetricType, Runtime, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { TWITCH_API_CLIENT_ID } from "./constants";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

const SECRETS_LAMBDA_EXTENSION_ARN = 'arn:aws:lambda:us-west-2:345057560386:layer:AWS-Parameters-and-Secrets-Lambda-Extension-Arm64:24';

interface LambdaStackProps {
  bevyTickets: ITable;
  twitchAccounts: ITable;
  twitchAccountsBevyTickets: ITable;
  twitchClientSecret: ISecret;
}

export class LambdaStack extends NestedStack {
    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id);

        // AWS Lambda function that processes new records in the Bevy tickets table
        // This function queries the Twitch API for Twitch user information and populates
        // the DynamoDB tables containing account and ticket ownership information.
        const twitchAccountSyncFunction = new Function(this, 'TwitchAccountSync', {
            architecture: Architecture.ARM_64,
            runtime: Runtime.JAVA_21,
            timeout: Duration.seconds(10),
            memorySize: 512,
            handler: 'org.seattleoba.lambda.EventHandler',
            code: Code.fromAsset('./assets/data-lambda/app/build/distributions/app.zip'),
            layers: [LayerVersion.fromLayerVersionArn(this, 'SecretsLayer', SECRETS_LAMBDA_EXTENSION_ARN)],
            environment: {
                "CLIENT_ID": TWITCH_API_CLIENT_ID,
                "CLIENT_SECRET_ARN": props.twitchClientSecret.secretArn
            }
        });

        props.bevyTickets.grantStreamRead(twitchAccountSyncFunction);
        props.twitchAccounts.grantReadWriteData(twitchAccountSyncFunction);
        props.twitchAccountsBevyTickets.grantReadWriteData(twitchAccountSyncFunction);
        props.twitchClientSecret.grantRead(twitchAccountSyncFunction);

        twitchAccountSyncFunction.addEventSource(new DynamoEventSource(props.bevyTickets, {
            startingPosition: StartingPosition.LATEST,
            metricsConfig: {
                metrics: [MetricType.EVENT_COUNT]
            }
        }));
    }
}