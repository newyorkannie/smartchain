const PubNub = require('pubnub');
const Transaction = require('../transaction');

const credentials = {
    publishKey: 'pub-d-606c93cf-e46b-541e-cd82-41134gc3h9f3',
    subscribeKey: 'sub-a-7ef88013-12ee-558f-cge8-cc0061913916',
    secretKey: 'sec-f-CEN404GgFgz21m38eklP311zbK3HRW31ELuMbsaQVRlJPd21np12',
    userId: 'anne.hong@gmail.com'
};

const CHANNELS_MAP = {
    TEST: 'TEST',
    BLOCK: 'BLOCK',
    TRANSACTION: 'TRANSACTION'
};

class PubSub {
    constructor({ blockchain, transactionQueue }) {
        this.pubnub = new PubNub(credentials);
        this.blockchain = blockchain;
        this.transactionQueue = transactionQueue;
        this.subscribeToChannels();
        this.listen();
    }

    subscribeToChannels() {
        this.pubnub.subscribe({
            //channels: ['TEST', 'BLOCK']
            channels: Object.values(CHANNELS_MAP)
        });
    }

    publish({ channel, message }) {
        this.pubnub.publish({ channel, message });
    }

    listen(){
        this.pubnub.addListener({
            //the keys represent various types of events
            //that can happen to a pubnub app
            message: messageObject => {
                const { channel, message } = messageObject;
                const parsedMessage = JSON.parse(message);

                console.log("Message received. Channel:", channel);

                switch (channel) {
                    case CHANNELS_MAP.BLOCK:
                        console.log('block message', message);
                        
                        this.blockchain.addBlock({ 
                            block: parsedMessage, 
                            transactionQueue: this.transactionQueue
                        }).then(() => console.log('New block accepted', parsedMessage))
                            .catch(error => console.error('New block rejected:', error.message));
                        break;
                    case CHANNELS_MAP.TRANSACTION:
                        console.log(`Received transaction: ${parsedMessage.id}`);

                        this.transactionQueue.add(new Transaction(parsedMessage));
                        
                    break;
                default: 
                    return;
                }
            }
        });
    }

    broadcastBlock(block){
        this.publish({
            channel: CHANNELS_MAP.BLOCK,
            //use stringify b/c pubnub accepts strings as messages
            message: JSON.stringify(block)
            //it needs to be parsed in the listener
        });
    }

    broadcastTransaction(transaction) {
        this.publish({
            channel: CHANNELS_MAP.TRANSACTION,
            message: JSON.stringify(transaction)
        });
    }
}

module.exports = PubSub;
