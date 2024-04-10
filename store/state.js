const Trie = require('./trie');

class State{
    constructor() {
        this.stateTrie = new Trie();
        this.StorageTrieMap = {};
    }

    putAccount({ address, accountData }) {
        //if the storage-map doesn't contain a value, 
        //then initialize new tree
        if (!this.StorageTrieMap[address]) {
            this.StorageTrieMap[address] = new Trie();
        }

        this.stateTrie.put({ 
            key: address, 
            value: {
                ...accountData, //spread operator which allows to add other fields
                storageRoot: this.StorageTrieMap[address].rootHash
            }
        });
    }

    getAccount({ address }) {
        return this.stateTrie.get({ key: address });
    }

    getStateRoot() {
        return this.stateTrie.rootHash;
    }
}

module.exports = State;