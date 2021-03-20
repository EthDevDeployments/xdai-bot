"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web3ContractInit_1 = require("../web3ContractInit");
const batching_1 = require("./batching");
const { mainnet: addresses } = require('../addresses');
function createPreOpportunityManager() {
    var opportunityParams = {
        stdCoin: 'dai',
        coins: ['hfy', 'usdc', 'dai', 'weth'],
        exchanges: ['uniswap', 'balancer'],
        portion: 1111111111,
        pairs: [],
        batchList: [],
    };
    function gatherPairs() {
        var pairDuplicates = createDuplicates();
        opportunityParams.exchanges.forEach((startExchange) => {
            opportunityParams.exchanges.forEach((endExchange) => {
                if (startExchange != endExchange) {
                    opportunityParams.coins.forEach((outerCoin) => {
                        opportunityParams.coins.forEach((innerCoin) => {
                            if (outerCoin != innerCoin) {
                                const oppositeKey = `${endExchange}${startExchange}${innerCoin}${outerCoin}`;
                                const currentKey = `${startExchange}${endExchange}${outerCoin}${innerCoin}`;
                                if (!pairDuplicates[oppositeKey]) {
                                    pairDuplicates[currentKey] = true;
                                    const newPairsArray = insertItem(opportunityParams.pairs, {
                                        outerCoin: getCoinAddress(outerCoin),
                                        innerCoin: getCoinAddress(innerCoin),
                                        startExchange: startExchange,
                                        endExchange: endExchange,
                                    });
                                    opportunityParams.pairs = newPairsArray;
                                    console.log({
                                        outerCoin: getCoinAddress(outerCoin),
                                        innerCoin: getCoinAddress(innerCoin),
                                        startExchange: startExchange,
                                        endExchange: endExchange,
                                    });
                                }
                            }
                        });
                    });
                }
            });
        });
    }
    function createDuplicates() {
        var pairDuplicates = {};
        opportunityParams.exchanges.forEach((startExchange) => {
            opportunityParams.exchanges.forEach((endExchange) => {
                if (startExchange != endExchange) {
                    opportunityParams.coins.forEach((outerCoin) => {
                        opportunityParams.coins.forEach((innerCoin) => {
                            if (outerCoin != innerCoin) {
                                const currentKey = `${startExchange}${endExchange}${outerCoin}${innerCoin}`;
                                pairDuplicates[currentKey] = false;
                            }
                        });
                    });
                }
            });
        });
        return pairDuplicates;
    }
    function insertItem(array, item) {
        let newArray = array.slice();
        newArray.splice(array.length, 0, item);
        return newArray;
    }
    function getCoinAddress(coin) {
        return addresses.kovanTokens[coin][0];
    }
    function createOpportunityBatchList() {
        gatherPairs();
        opportunityParams.batchList = opportunityParams.pairs.map((pair) => {
            return {
                ethCall: web3ContractInit_1.ethDevContract.methods.getOpportunity(pair.startExchange, pair.endExchange, pair.outerCoin, pair.innerCoin, getCoinAddress(opportunityParams.stdCoin), opportunityParams.portion, web3ContractInit_1.kovanProxies).call,
                onSuccess: (result) => {
                    if (!result.ignore) {
                        console.log(result);
                        //TODO: handle the return values from the contract
                    }
                },
                onError: (result) => {
                    console.log(result);
                    //TODO: handle the return values from the contract
                },
            };
        });
    }
    async function executeLoadedBatch() {
        await batching_1.batchRequest(opportunityParams.batchList);
    }
    return {
        createOpportunityBatchList,
        executeLoadedBatch,
        gatherPairs,
    };
}
exports.default = createPreOpportunityManager;
