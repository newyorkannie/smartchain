const uuid = require('uuid/v4');
const Account = require('../account');

const TRANSACTION_TYPE_MAP = {
    CREATE_ACCOUNT: 'CREATE_ACCOUNT',
    TRANSACT: 'TRANSACT'
};

class Transaction {
    constructor({ id, from, to, value, data, signature }) {
        // //these are all fields, incoming data, attach an "instance field"
        // this.id = id;           //instance field is attached to incoming id
        // this.from = from;       //sender
        // this.to = to;           //receipient
        // this.value = value;     //how much currency gets exchanged in the txn

        // this.data = data;       
        // //data == a way to have more functionality than a simple exchange
        // //     == describe a state change for the decentralized computer
        // //     == other transactions other than standard ones are going to leverage this data field

        // this.signature = signature;     //signature allows to officially sign off an authorize a transaction

        this.id = id || uuid();             //if id is not generated than uuid() will generate one
        this.from = from || '-';            //all strings will fall back to '-'
        this.to = to || '-';                //all strings will fall back to '-'
        this.value = value || 0;            //value will fall back to 0
        this.data = data || '-';            //all strings will fall back to '-'
        this.signature = signature || '-';   //all strings will fall back to '-'
    }

    static createTransaction({ account, to, value }) {
        //Two results
        //1. a regular transaction that exchanges currency between 2 accounts
        //2. a transaction that will contain account data -> register account in decentralized system

        if (to) {
            //make object transactionData
            const transactionData = {
                id: uuid(),
                from: account.address,
                to,
                value,
                data: { type: TRANSACTION_TYPE_MAP.TRANSACT } //2 TYPES.TRANSACT OR /CREATE
            }

            return new Transaction({
                ...transactionData,  //JS spread operator
                signature: account.sign(transactionData)
            });
        }

        //this is for Create account txn
        //data object is not needed for from-address, to-address, value, 
        //nor signature bc no authorization of currency exchange, no uuid
        return new Transaction({
            data: {
                type:  TRANSACTION_TYPE_MAP.CREATE_ACCOUNT,
                accountData: account.toJSON()
            }
        });
    }

    static validateStandardTransaction({ transaction }){
        return new Promise((resolve, reject) => {
            const { id, from, signature } = transaction;
            const transactionData = { ...transaction };
            delete transactionData.signature;

            if (!Account.verifySignature({ 
                publicKey: from, 
                data: transactionData, 
                signature 
            })) {
                return reject(new Error(`Transaction: ${id}, `));
            }
                return resolve();
        });
    }
    static validateCreateAccountTransaction({ transaction }){
        return new Promise((resolve, reject) => {
            const expectedAccountDataFields = Object.keys(new Account().toJSON());
            const fields = Object.keys(transaction.data.accountData);

            if (fields.length !== expectedAccountDataFields.length) {
                return reject(
                    new Error(`The transaction account data has an incorrect number of fields`)
                );
            }

            fields.forEach(field => {
                if (!expectedAccountDataFields.includes(field)) {
                    return reject(new Error(
                        `The field: ${field}, is unexpected for account data`
                    ));
                }
            });

            return resolve();
        });
    }
}

module.exports = Transaction;

