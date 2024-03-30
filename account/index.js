const { ec, keccakHash } = require('../util');
const { STARTING_BALANCE } = require('../config');

class Account {
    constructor() {
        this.keyPair = ec.genKeyPair();  //KEYPAIR == PUBLIC + PRIVATE KEY
        this.address = this.keyPair.getPublic().encode('hex');   //address = public key
        this.balance = 1000;
        
    }

    //result of function
    sign(data) {
        //call keyPair function
        return this.keyPair.sign(keccakHash(data)); 
        //sign data expects a string, which is why we need keccakHash
    }

    //make a smaller instance of Account
    //KeyPair instance is not necessary
    //for createAccount
    toJSON() {
        return {
            address: this.address,
            balance: this.balance
        };
    }

    static verifySignature({ publicKey, data, signature }) {
        const keyFromPublic = ec.keyFromPublic(publicKey, 'hex'); //temp

        return keyFromPublic.verify(keccakHash(data), signature);
    }
}

module.exports = Account;