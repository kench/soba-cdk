import { NestedStack } from "aws-cdk-lib";
import { AttributeType, Billing, TableClass, TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

class DynamoDBStack extends NestedStack {
  public bevyTickets: TableV2;
  public twitchAccounts: TableV2;
  public twitchAccountsBevyTickets: TableV2;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const bevyTicketTable = new TableV2(this, 'BevyTicketsTable', {
      billing: Billing.onDemand(),
      partitionKey: { name: 'event_id', type: AttributeType.NUMBER },
      sortKey: { name: 'id', type: AttributeType.NUMBER },
      tableClass: TableClass.STANDARD,
      tableName: 'BevyTickets'
    });
    this.bevyTickets = bevyTicketTable;

    const twitchAccountTable = new TableV2(this, 'TwitchAccountsTable', {
      billing: Billing.onDemand(),
      partitionKey: { name: 'id', type: AttributeType.NUMBER },
      tableClass: TableClass.STANDARD,
      tableName: 'TwitchAccounts',
      globalSecondaryIndexes: [{
        indexName: 'UserName',
        partitionKey: { name: 'user_name', type: AttributeType.STRING }
      }]
    });
    this.twitchAccounts = twitchAccountTable;

    const twitchAccountBevyTicketTable = new TableV2(this, 'TwitchAccountsBevyTicketTable', {
      billing: Billing.onDemand(),
      partitionKey: { name: 'bevy_ticket_id', type: AttributeType.NUMBER },
      tableClass: TableClass.STANDARD,
      tableName: 'TwitchAccountsBevyTickets',
      globalSecondaryIndexes: [
        {
          indexName: 'UserId',
          partitionKey: { name: 'twitch_id', type: AttributeType.NUMBER },
          sortKey: { name: 'bevy_event_id', type: AttributeType.NUMBER }
        },
        {
          indexName: 'EventId',
          partitionKey: { name: 'bevy_event_id', type: AttributeType.NUMBER },
          sortKey: { name: 'twitch_id', type: AttributeType.NUMBER }
        }
      ]
    });
    this.twitchAccountsBevyTickets = twitchAccountBevyTicketTable;
  }
}

export default DynamoDBStack;