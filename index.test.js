const Account = require('./index');

describe('Account', () => {
    let account, data, signature;

    beforeEach(() => {
        account = new Account(); //makes new instance of an account class
        data = { foo: 'foo' };
        signature = account.sign(data);
        
        //console.log('signature', signature); //2nd parameter is object [DELETE after debugging]
    });

    //first test using describe/it/expect to test 2 cases: 
    //1. verifySignature (below)
    //2. signature = account.sign(data); //test inadvertently above
    describe('verifySignature()', () => {
        it('validates a signature generated by the account', () => {
            expect(Account.verifySignature({
                    publicKey: account.address,
                    data, 
                    signature
            })).toBe(true);
        });

        //second test for invalid signature
        it('invalidates a signature not generated by the account', () => {
            expect(Account.verifySignature({
                publicKey: new Account().address,
                data, 
                signature
            })).toBe(false);
        });

    });
});