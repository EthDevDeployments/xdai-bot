"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const batching_1 = require("./batching");
function createOpportunityManager(pgaManagers, shouldIgnoreNextBlock, chain) {
    let opportunityParams = {
        pairs: [],
        batchList: [],
    };
    async function gatherPairs() {
        let allConfigurations = createAllConfigurations();
        chain.exchanges.forEach((startExchange) => {
            chain.exchanges.forEach((endExchange) => {
                if (startExchange !== endExchange) {
                    chain.coins.forEach((outerCoin) => {
                        if (chain.outerCoins.includes(outerCoin)) {
                            chain.coins.forEach((innerCoin) => {
                                if (outerCoin !== innerCoin) {
                                    const currentKey = `${startExchange}${endExchange}${outerCoin}${innerCoin}`;
                                    const swappedCoinsKey = `${startExchange}${endExchange}${innerCoin}${outerCoin}`;
                                    const swappedExchangesKey = `${endExchange}${startExchange}${outerCoin}${innerCoin}`;
                                    const swappedBothKey = `${endExchange}${startExchange}${innerCoin}${outerCoin}`;
                                    if (!allConfigurations[currentKey] && !allConfigurations[swappedCoinsKey] && !allConfigurations[swappedExchangesKey] && !allConfigurations[swappedBothKey]) {
                                        allConfigurations[currentKey] = true;
                                        allConfigurations[swappedCoinsKey] = true;
                                        allConfigurations[swappedExchangesKey] = true;
                                        allConfigurations[swappedBothKey] = true;
                                        opportunityParams.pairs = insertItem(opportunityParams.pairs, {
                                            outerCoin: getCoinAddress(outerCoin),
                                            innerCoin: getCoinAddress(innerCoin),
                                            startExchange: startExchange,
                                            endExchange: endExchange,
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        });
        opportunityParams.pairs = await Promise.all(opportunityParams.pairs.filter(async (pair) => {
            const proxies = chain.web3.eth.abi.encodeParameter({
                Exchanges: {
                    exchangeIn: 'string',
                    exchangeOut: 'string',
                    inProxy: 'address',
                    outProxy: 'address',
                },
            }, {
                exchangeIn: chain.proxies[pair.startExchange]['Type'],
                exchangeOut: chain.proxies[pair.endExchange]['Type'],
                inProxy: chain.proxies[pair.startExchange]['Proxy'],
                outProxy: chain.proxies[pair.endExchange]['Proxy'],
            });
            const returnedOpportunity = await chain.findOppContract.methods.getBestOpportunity(pair.outerCoin, pair.innerCoin, getCoinAddress(chain.stdCoin), chain.portion, proxies).call();
            if (returnedOpportunity.awayPool !== '0x0000000000000000000000000000000000000000' && returnedOpportunity.returnPool !== '0x0000000000000000000000000000000000000000') {
                console.log(returnedOpportunity);
                return true;
            }
            else {
                return false;
            }
        }));
    }
    function createAllConfigurations() {
        let allConfigurations = {};
        chain.exchanges.forEach((startExchange) => {
            chain.exchanges.forEach((endExchange) => {
                chain.coins.forEach((outerCoin) => {
                    chain.coins.forEach((innerCoin) => {
                        const currentKey = `${startExchange}${endExchange}${outerCoin}${innerCoin}`;
                        allConfigurations[currentKey] = false;
                    });
                });
            });
        });
        return allConfigurations;
    }
    function insertItem(array, item) {
        let newArray = array.slice();
        newArray.splice(array.length, 0, item);
        return newArray;
    }
    function getCoinAddress(coin) {
        return chain.coinLookup[coin];
    }
    async function createOpportunityBatchList() {
        await gatherPairs();
        opportunityParams.batchList = await Promise.all(opportunityParams.pairs.map(async (pair) => {
            const proxies = chain.web3.eth.abi.encodeParameter({
                Exchanges: {
                    exchangeIn: 'string',
                    exchangeOut: 'string',
                    inProxy: 'address',
                    outProxy: 'address',
                },
            }, {
                exchangeIn: chain.proxies[pair.startExchange]['Type'],
                exchangeOut: chain.proxies[pair.endExchange]['Type'],
                inProxy: chain.proxies[pair.startExchange]['Proxy'],
                outProxy: chain.proxies[pair.endExchange]['Proxy'],
            });
            return {
                ethCall: chain.findOppContract.methods.getBestOpportunity(pair.outerCoin, pair.innerCoin, getCoinAddress(chain.stdCoin), chain.portion, proxies).call,
                onSuccess: async (opportunity) => {
                    if (!opportunity.ignore && opportunity.stdDiff > 0) {
                        if (chain.profitable(opportunity, chain.gasPriceWei(true))) {
                            if (!(shouldIgnoreNextBlock(opportunity.awayPool) || shouldIgnoreNextBlock(opportunity.returnPool))) {
                                //console.log(`Profitable: ${opportunity.stdDiff}`)
                                for (const manager of pgaManagers) {
                                    if (!manager.getIsBusy()) {
                                        manager.setIsBusy(true);
                                        manager.evaluateOpportunity(opportunity);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                },
                onError: (err) => {
                    console.log(err);
                },
            };
        }));
    }
    async function executeLoadedBatch() {
        //console.time('Batch time')
        await batching_1.batchRequest(opportunityParams.batchList, chain);
        //console.timeEnd('Batch time')
    }
    return {
        createOpportunityBatchList,
        executeLoadedBatch,
        opportunityParams,
    };
}
exports.default = createOpportunityManager;
