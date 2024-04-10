const uuid = require('uuid/v4');
const Account = require('../account');
const Interpreter = require('../interpreter/index_7');
const { MINING_REWARD } = require('../config');

const TRANSACTION_TYPE_MAP = {
    CREATE_ACCOUNT: 'CREATE_ACCOUNT',
    TRANSACT: 'TRANSACT',
    MINING_REWARD: 'MINING_REWARD'
};

class Transaction {
    constructor({ id, from, to, value, data, signature, gasLimit }) {
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
        this.gasLimit = gasLimit || 0;
    }

    static createTransaction({ account, to, value, beneficiary, gasLimit }) {
if (beneficiary) {
    return new Transaction({
        to: beneficiary,
        value: MINING_REWARD,
        gasLimit,
        data: { type: TRANSACTION_TYPE_MAP.MINING_REWARD }
    });
}

        //Two results
        //1. a regular transaction that exchanges currency between 2 accounts
        //2. a transaction that will contain account data -> register account in decentralized system

        if (to) {
            //make object transactionData
            const transactionData = {
                id: uuid(),
                from: account.address,
                to,
                value: value || 0,
                gasLimit: gasLimit || 0,
                data: { type: TRANSACTION_TYPE_MAP.TRANSACT } //2 TYPES.TRANSACT OR /CREATE
            };

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

    static validateStandardTransaction({ state, transaction }){
        return new Promise((resolve, reject) => {
            const { id, from, signature, value, to, gasLimit } = transaction;
            const transactionData = { ...transaction };
            delete transactionData.signature;

            if (!Account.verifySignature({ 
                publicKey: from, 
                data: transactionData, 
                signature 
            })) {
                return reject(new Error(`Transaction: ${id}, signature is invalid`));
            }

                const fromBalance = state.getAccount({ address: from }).balance;

                //serve error if requested value is greater than balance
                if ((value + gasLimit) > fromBalance) {
                    return reject(new Error(
                        `Transaction value and gasLimit: ${value} exceeds the balance: ${fromBalance}`
                    ));
                }

                //checks to see if an address is valid before running a txn
                const toAccount = state.getAccount({ address: to });

                if (!toAccount) {
                    return reject(new Error(
                        //instance of an error
                        `The to field: ${to} does not exist`
                    ));
                }

                //if the toAccount has a codeHash, 
                //that means a standardTransaction is trying to hit a smart contract
                if (toAccount.codeHash) {
                    const { gasUsed } = new Interpreter({
                        storageTrie: state.storageTrieMap[toAccount.codeHash]
                    }).runCode(toAccount.code);

                    //if gasUsed value is greater than the gasLimit, then make the attempt to hit
                    //a smart contract invalid
                    if(gasUsed > gasLimit) {
                        return reject(new Error(
                            `Transaction needs more gas. Provided: ${gasLimit}. Needs: ${gasUsed}` 
                        ));
                    }
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

    static validateMiningRewardTransaction({ transaction }) {
        return new Promise((resolve, reject) => {
            //destructure the value from the transaction
            const { value } = transaction;

            if (value !== MINING_REWARD) {
                return reject(new Error(
                    `The provided mining reward value: ${value} does not equal ` + 
                    `the official value: ${MINING_REWARD}`
                ));
            }

            return resolve();
        });
    }

    static validateTransactionSeries({ transactionSeries, state }) {
        return new Promise(async (resolve, reject) => {
            for (let transaction of transactionSeries) {

                try {
                //call the existing relevant validateTransaction method
                switch (transaction.data.type) {
                    case TRANSACTION_TYPE_MAP.CREATE_ACCOUNT: 
                        await Transaction.validateCreateAccountTransaction({ 
                            transaction 
                        });
                        break;
                    case TRANSACTION_TYPE_MAP.TRANSACT:  //standardTxn type
                        await Transaction.validateStandardTransaction({ 
                            state,
                            transaction 
                        });
                        break;

                        case TRANSACTION_TYPE_MAP.MINING_REWARD:
                            await Transaction.validateMiningRewardTransaction({
                                state,
                                transaction
                            });
                            break;
                        default:
                            break;
                }
            } catch (error) {
                return reject(error);
            }
        }

            return resolve();
        });
    }



    static runTransaction({ state, transaction }){
        switch(transaction.data.type) {
            case TRANSACTION_TYPE_MAP.TRANSACT:
                Transaction.runStandardTransaction({ state, transaction });
                console.log(
                    ' -- Updated account data to reflect the standard transaction'
                );
                break;
            case TRANSACTION_TYPE_MAP.CREATE_ACCOUNT:
                Transaction.runCreateAccountTransaction({ state, transaction });
                console.log(' -- Stored the account data');
                break;
            case TRANSACTION_TYPE_MAP.MINING_REWARD:
                Transaction.runMiningRewardTransaction({ state, transaction });
                console.log(' --Updated account data to reflect the mining reward');
                break;
            default:
                break;
        }
    }

    static runStandardTransaction({ state, transaction }){
        //first get the account data relevant to the transaction
        const fromAccount  = state.getAccount({ address: transaction.from });
        const toAccount = state.getAccount({ address: transaction.to });

        let gasUsed = 0;
        let result;

        if (toAccount.codeHash) {
            //replace this://console.log(`toAccount`, toAccount); 
            //with and interpreter class
            const interpreter = new Interpreter({
                storageTrie: state.storageTrieMap[toAccount.codeHash]
            });
            ({ gasUsed, result } = interpreter.runCode(toAccount.code));

            console.log(
                ` -*- Smart contract execution: ${transaction.id} - RESULT: ${result}`
                );
            }

            
        //we want the value of the transaction
        const { value, gasLimit } = transaction; 
        const refund1 = gasLimit - gasUsed; 
        //therefore if the limit is $50 and $30 was used, we need a way to calculate a refund

        //balance can be calculated
        fromAccount.balance -= value; //from account is deducting the value
        fromAccount.balance -= gasLimit; //note that what is deducted from sender is gasUsed
        fromAccount.balance += refund1; //adds a credit for gas unused, balance after refund
        toAccount.balance += value; //to account increases the value
        toAccount.balance += gasUsed;

        //to save the results, we put the data back into the states
        state.putAccount({ address: transaction.from, accountData: fromAccount });
        state.putAccount({ address: transaction.to, accountData: toAccount });
    }

    static runCreateAccountTransaction({ state, transaction }){
        const { accountData } = transaction.data;
        const { address, codeHash } = accountData;

        //ternary
        //if codeHash is defined as codeHash, then use the codeHash
        //if not, use address
        state.putAccount({ address: codeHash ? codeHash : address, accountData });    
    }

    static runMiningRewardTransaction({ state, transaction }) {
        //destructure the to and value from transaction
        const { to, value } = transaction;
        const accountData = state.getAccount({ address: to });

        accountData.balance += value;

        state.putAccount({ address: to, accountData });
    }
}

module.exports = Transaction;

