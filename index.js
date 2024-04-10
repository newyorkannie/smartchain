const { ec, keccakHash } = require('../util');
const { STARTING_BALANCE } = require('../config');

class Account {
    constructor({ code } = {}) {
        this.keyPair = ec.genKeyPair();  //KEYPAIR == PUBLIC + PRIVATE KEY
        this.address = this.keyPair.getPublic().encode('hex');   //address = public key
        this.balance = 1000;
        this.code = code || [];
        this.generateCodeHash();
    }

    generateCodeHash() {
        //[PSEUDOCODE] this.codeHash = this.code.length > 0 ? generate hash : null;
        //substitute generate hash with keccaKHash
        this.codeHash = this.code.length > 0 
            ? keccakHash(this.address + this.code)
            : null;
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
            balance: this.balance,
            code: this.code,
            codeHash: this.codeHash
        };
    }

    static verifySignature({ publicKey, data, signature }) {
        const keyFromPublic = ec.keyFromPublic(publicKey, 'hex'); //temp

        return keyFromPublic.verify(keccakHash(data), signature);
    }

    static calculateBalance({ address, state }) {
        //get the account using the state object
        return state.getAccount({ address }).balance;
    }
}

module.exports = Account;