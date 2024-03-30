const keccak256 = require('js-sha3').keccak256;
const EC = require('elliptic').ec; //EC == elliptic cryptography, can ixt with public/private keys

//make an instance of EC
const ec = new EC('secp256k1'); 
//sec == standards of efficient cryptography
//p == prime, use a prime number in the elliptic-based algorithm to generate the curve
//256 == 256 bits represents the prime number
//k == Koblitz, a mathmatician
//1 == the first implementation

const sortCharacters = data => {
    return JSON.stringify(data).split('').sort().join('');
}

const keccakHash = data => {
    const hash = keccak256.create();

    hash.update(sortCharacters(data));

    return hash.hex();
}

module.exports = {
    sortCharacters,
    keccakHash,
    ec
};