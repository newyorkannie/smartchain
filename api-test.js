const request = require('request');

const BASE_URL = 'http://localhost:3000';

const postTransact = ({ to, value }) => {
    return new Promise((resolve, reject) => {
        //in this callback area, we will trigger
        //which is this endpoint
        request(`${BASE_URL}/account/transact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, value })
        },(error, reponse, body) => {
            //the response is going to come back as a string
            //we can resolve this as part of the promise 
            return resolve(JSON.parse(body));
        });
    });
}

const getMine = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            request(`${BASE_URL}/blockchain/mine`, (error, response, body) => {
                return resolve(JSON.parse(body));
            });
        }, 1000);
    });
}

postTransact({})
    .then(postTransactResponse => {
        console.log(
            'postTransactResponse (Create Account Transaction)',
            postTransactResponse
        );

        const toAccountData = postTransactResponse.transaction.data.accountData;

        return getMine();
        //replace 'foo-recipient' with 'toAccountData.address'
        //postTransact({ to: 'foo-recipient', value: 20 })
        //postTransact({ to: toAccountData.address, value: 20 })
    }).then(getMineResponse => {
        console.log('getMineResponse', getMineResponse);

        //test call postTransact with receipient and value fields
        return postTransact({ to: 'foo-recipient', value: 20 })
    })

    .then(postTransactResponse2 => {
        console.log(
        'postTransactResponse (Standard Transaction)',
        postTransactResponse2
    );
})
