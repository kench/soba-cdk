import { NestedStack, RemovalPolicy } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

class S3Stack extends NestedStack {
    public readonly bevyFilesBucket: Bucket;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        const bevyFilesBucket = new Bucket(this, 'BevyFilesBucket', {
            bucketName: 'soba-bevy-files',
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL
        });
        bevyFilesBucket.applyRemovalPolicy(RemovalPolicy.RETAIN);

        this.bevyFilesBucket = bevyFilesBucket;
    }
}

export default S3Stack;