import { IQueue, Queue } from "aws-cdk-lib/aws-sqs";
import { NestedStack } from "aws-cdk-lib/core";
import { Construct } from "constructs";

export class SQSStack extends NestedStack {
    public readonly bevyTicketEvents: IQueue;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const deadLetterQueue = new Queue(this, 'BevyTicketEventsDeadLetterQueue', {
            queueName: 'BevyTicketEvents-dlq'
        });

        this.bevyTicketEvents = new Queue(this, 'BevyTicketEvents', {
            queueName: 'BevyTicketEvents',
            deadLetterQueue: {
                maxReceiveCount: 3,
                queue: deadLetterQueue,
            }
        });
    }
}