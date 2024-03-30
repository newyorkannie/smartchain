class TransactionQueue {
    constructor() {
        this.transactionMap = {};
    }

    add(transaction) {
        this.transactionMap[transaction.id] = transaction;
      }

    //method is named after a block's stored transactions
    getTransactionSeries() {    
        //purpose is to return all the transactions stored in the block, 
        //within the transactionMap object, LINE 7
        return Object.values(this.transactionMap);
    }

    clearBlockTransactions({ transactionSeries }) {
        for (let transaction of transactionSeries) {
          delete this.transactionMap[transaction.id];
        }
    }
}

module.exports = TransactionQueue;