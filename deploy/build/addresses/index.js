"use strict";
const contractsMainnet = require('./contracts-mainnet.json');
const contractsxDai = require('./contracts-xDai.json');
const tokensMainnet = require('./tokens-mainnet.json');
const tokensxDai = require('./tokens-xDai.json');
const tokensKovan = require('./tokens-kovan.json');
const contractsKovan = require('./contracts-kovan.json');
module.exports = {
    mainnet: {
        contractsMainnet: contractsMainnet,
        contractsxDai: contractsxDai,
        tokensMainnet: tokensMainnet,
        tokensxDai: tokensxDai,
        tokensKovan: tokensKovan,
        contractsKovan: contractsKovan
    },
};
