import { NestedStack, RemovalPolicy } from "aws-cdk-lib";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

class HostedZoneStack extends NestedStack {
  public hostedZone: HostedZone;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Route 53 hosted zone for delegation from SOBA Squarespace account
    const hostedZone = new HostedZone(this, 'SOBAHostedZone', {
      zoneName: 'services.seattleoba.org',
    });
    hostedZone.applyRemovalPolicy(RemovalPolicy.RETAIN);

    this.hostedZone = hostedZone;
  }
}

export default HostedZoneStack;