import { NestedStack } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

class SecretsStack extends NestedStack {
    constructor(scope: Construct, id: string) {
        super(scope, id);
        const twitchClientSecret = new Secret(this, 'TwitchClientSecret', {
            secretName: 'soba-twitch-client-secret'
        })
    }
}

export default SecretsStack;