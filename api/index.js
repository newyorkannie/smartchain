const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const Account = require('../account');
const Blockchain = require('../blockchain');
const Block = require('../blockchain/block');
const PubSub = require('./pubsub');
const State = require('../store/state');
const Transaction = require('../transaction');
const TransactionQueue = require('../transaction/transaction-queue');

const app = express();
app.use(bodyParser.json());

const state = new State();
const blockchain = new Blockchain({ state });
const transactionQueue = new TransactionQueue();
const pubsub = new PubSub({ blockchain, transactionQueue });
const account = new Account();
const transaction = Transaction.createTransaction({ account });

setTimeout(() => {
    pubsub.broadcastTransaction(transaction);
},500);

app.get('/blockchain', (req, res, next) => {
    //this returns the blockchain as it currently is

    const { chain } = blockchain; //this produces destructured chain

    //allows you to respond with a JSON object
    res.json({ chain });
});

//establishes a new endpoint which is a GET request
app.get('/blockchain/mine', (req, res, next) => {
    //gives the last block
    const lastBlock = blockchain.chain[blockchain.chain.length-1];
    //allows a miner to add another block
    const block = Block.mineBlock({
        lastBlock,
        beneficiary: account.address,
        transactionSeries: transactionQueue.getTransactionSeries(),
        stateRoot: state.getStateRoot()
    });

    //this method adds the newly mined block to the blockchain
    blockchain.addBlock({ block, transactionQueue })
        .then(() => {
            pubsub.broadcastBlock(block); //pass in block object that was mined

            res.json({ block });
        })
        .catch(next);
    });

app.post('/account/transact', (req, res, next) => {
    //request body data and destructure it to take TO field
    const { code, gasLimit, to, value } = req.body;
    //instantiate a new tranaction
    const transaction = Transaction.createTransaction({
        //these are objects -> account, to, value
        //use ! and ternary to write this conditional
        //if the to-field is undefined, 
        //instantiate a new account otherwise set it to account
        account: !to ? new Account({ code }) : account,
        gasLimit,
        to, 
        value
    });
    
    pubsub.broadcastTransaction(transaction);

    res.json({ transaction });   //respond
});

//new endpoint to get balance
//use the Account class to calculate the balance
app.get('/account/balance', (req, res, next) => {
    const { address } = req.query

    const balance = Account.calculateBalance({ //implement this later
        address: address || account.address,
        state 
    });

    res.json({ balance });
});

app.use((err, req, res, next) => {
    console.error('Internal server error:', err);

    res.status(500).json({ message: err.message })
});

const peer = process.argv.includes('--peer');

//to test, distribut to multiple ports, using ternary conditional
const PORT = peer
    ? Math.floor(2000 + Math.random()*1000)
    : 3000;

if (peer) {
    //request method
    request('http://localhost:3000/blockchain', (error, response, body) => {
        const { chain } = JSON.parse(body);


        blockchain.replaceChain({ chain })
            .then(() => console.log('Synchronized blockchain with the root node'))
            .catch(error => console.error('Synchronization error:', error.message));
    });
}

app.listen(PORT, () => console.log(`Listening AT PORT: ${PORT}`));