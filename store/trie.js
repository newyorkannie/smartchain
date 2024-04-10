const _ = require('lodash');  //underscore == common
const { keccakHash } = require('../util');

class Node {
    constructor() {
        this.value = null;
        this.childMap = {};
    }
}

class Trie {
    constructor() {
        this.head = new Node();
        this.generateRootHash();
    }

    generateRootHash() {
        this.rootHash = keccakHash(this.head);
    }

    get({ key }) {
        let node = this.head;

        for (let character of key) {
            if (!node.childMap[character]) {
                return null;
            } else {
                node = node.childMap[character];
            }
        }

        //code returns the original object, 
        //which results in inconsistent hashes of 2 transactions
        //return node.value; 
        
        //to make clone, use lodash
        return _.cloneDeep(node.value);

    }

    put({ key, value }) {
        let node = this.head;

        //for loop to check each character of a key
        for (let character of key) {
            if (!node.childMap[character]) {
                node.childMap[character] = new Node();
            }

            //update the current node to the instance,
            //node.childMap character
            node = node.childMap[character];
        }
        
        //the last node represents the value
        node.value = value;

        this.generateRootHash();
    }
    static buildTrie({ items }) {
        //const trie = new Trie();
        
        //can substitute with this keyword
        const trie = new this();
        //loop for put method, key/value
        for (let item of items.sort((a, b) => keccakHash(a) > keccakHash(b))) {
            trie.put({ key: keccakHash(item), value: item });
        }

        return trie;
    };
}

module.exports = Trie;

// //DEBUGGING CODE FOR LECTURE 43, PART 1
// const trie = new Trie();
// trie.put({ key: 'foo', value: 'bar' });
// trie.put({key: 'food', value: 'ramen'});
// //console.log('trie', trie);
// //stringify trie to see the entire tree
// console.log('trie', JSON.stringify(trie));

