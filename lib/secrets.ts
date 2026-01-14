import { NestedStack } from "aws-cdk-lib";
import { Construct } from "constructs";

class SecretsStack extends NestedStack {
    constructor(scope: Construct, id: string) {
        super(scope, id);
    }
}

export default SecretsStack;