"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PGAManager_1 = __importDefault(require("./PGAManager"));
const request = require('request-promise');
const path = require('path');
const async_mutex_1 = require("async-mutex");
function createMempoolManager(chain) {
    var _a, _b, _c;
    let thresholdGasPrice = chain.gasPriceWei(true);
    let blockNumber = 0;
    let pendingBlockTxs = {};
    const walletKeys = (_a = process.env.WALLETKEYS) === null || _a === void 0 ? void 0 : _a.split(', ').map((walletKey) => {
        return chain.web3.eth.accounts.wallet.add(walletKey);
    });
    const walletAddresses = (_b = process.env.WALLETADDRESSES) === null || _b === void 0 ? void 0 : _b.split(', ').map((walletAddress) => {
        return walletAddress;
    });
    const oppositeBotWalletAddresses = (_c = process.env.OPPWALLETADDRESSES) === null || _c === void 0 ? void 0 : _c.split(', ').map((walletAddress) => {
        return walletAddress;
    });
    const pgaManagers = walletKeys === null || walletKeys === void 0 ? void 0 : walletKeys.map((walletkey, i) => {
        if (walletAddresses !== undefined) {
            return PGAManager_1.default(updateThresholdOnBid, getFirstBidAmount, chain, walletkey, walletAddresses[i], i);
        }
    });
    //const newBlocKMutex = new Mutex()
    const newPendingTxMutex = new async_mutex_1.Mutex();
    async function parseTransaction(transaction) {
        await newPendingTxMutex.runExclusive(async () => {
            // Break down the transaction
            const data = await chain.web3.eth.getTransaction(transaction); // Get transaction information
            if (data === null || data.to === null)
                return; // Check if transaction is valid
            if (chain.ignoreAddresses.includes(data.to))
                return;
            if ((walletAddresses === null || walletAddresses === void 0 ? void 0 : walletAddresses.includes(data.from)) || (oppositeBotWalletAddresses === null || oppositeBotWalletAddresses === void 0 ? void 0 : oppositeBotWalletAddresses.includes(data.from)))
                return;
            const contractCode = await chain.web3.eth.getCode(data.to); // Get contract code
            if (contractCode == '0x')
                return; // Return if transaction is not a contract
            // Aquire its gas price
            const gasPrice = Number(data.gasPrice);
            if (gasPrice >= thresholdGasPrice) {
                // Get execution data depending on the chain we're arbing on
                let executionData;
                switch (chain.type) {
                    case 'xdai':
                        executionData = await chain.checkTransactionDetails(data['raw']);
                        const xdaiUniqueKeys = {};
                        for (let ed of executionData) {
                            const key = ed['action']['to'];
                            if (!xdaiUniqueKeys[key]) {
                                xdaiUniqueKeys[key] = true;
                                // Determine whether this pending tx is worth adding to our datastructure
                                if (await updatePendingTxs(key, gasPrice)) {
                                    if (pgaManagers !== undefined) {
                                        for (const manager of pgaManagers) {
                                            if (manager !== undefined) {
                                                //console.log(`${blockNum} ${key}`)
                                                manager.evaluatePendingTx(key, gasPrice, transaction);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    case 'kovan' || 'mainnet':
                        executionData = await chain.checkTransactionDetails({ from: data.from, to: data.to, gas: chain.web3.utils.toHex(data.gas), gasPrice: chain.web3.utils.toHex(data.gasPrice), value: chain.web3.utils.toHex(data.value), data: data.input });
                        const kovanUniqueKeys = {};
                        for (let key in executionData) {
                            // Determine whether this pending tx is worth adding to our datastructure
                            if (updatePendingTxs(key, gasPrice)) {
                                kovanUniqueKeys[key] = true;
                                if (pgaManagers !== undefined) {
                                    for (const manager of pgaManagers) {
                                        if (manager !== undefined) {
                                            manager.evaluatePendingTx(key, gasPrice, transaction);
                                        }
                                    }
                                }
                            }
                        }
                        break;
                }
            }
        });
    }
    async function updateMempoolBlock(blockNum) {
        await newPendingTxMutex.runExclusive(async () => {
            //update threshold gas price
            if (blockNum > blockNumber) {
                blockNumber = blockNum;
                thresholdGasPrice = chain.gasPriceWei(true);
                pendingBlockTxs = {};
                if (pgaManagers !== undefined) {
                    for (const manager of pgaManagers) {
                        manager === null || manager === void 0 ? void 0 : manager.updateBlock(blockNum);
                    }
                }
            }
        });
    }
    function updatePendingTxs(key, gasPrice) {
        let requiresRebid = false;
        // Update for tx with a higher gas price or insert if it's a tx we haven't seen yet
        if (key in pendingBlockTxs) {
            if (gasPrice > pendingBlockTxs[key]) {
                pendingBlockTxs[key] = gasPrice;
                // See if the update requires a rebid
                requiresRebid = true;
            }
        }
        else {
            pendingBlockTxs[key] = gasPrice;
            // See if the insertion requires a rebid
            requiresRebid = true;
        }
        return requiresRebid;
    }
    function getFirstBidAmount(baseBidAmount, opportunity) {
        // Initialize our bid to the base bid amount
        let gasPriceBid = baseBidAmount;
        // Check to see if there was a pending tx that interacted with either pool to update the bid
        if (opportunity.awayPool in pendingBlockTxs) {
            if (opportunity.returnPool in pendingBlockTxs) {
                if (pendingBlockTxs[opportunity.awayPool] > pendingBlockTxs[opportunity.returnPool]) {
                    gasPriceBid += pendingBlockTxs[opportunity.awayPool];
                }
                else {
                    gasPriceBid += pendingBlockTxs[opportunity.returnPool];
                }
            }
            else {
                gasPriceBid += pendingBlockTxs[opportunity.awayPool];
            }
        }
        else if (opportunity.returnPool in pendingBlockTxs) {
            gasPriceBid += pendingBlockTxs[opportunity.returnPool];
        }
        else {
            // There's no competition so we pick the default gas price
            gasPriceBid = chain.gasPriceWei(true);
        }
        return gasPriceBid;
    }
    function updateThresholdOnBid(newBid) {
        thresholdGasPrice = newBid;
    }
    function shouldIgnoreNextBlock(pooladdress) {
        if (pgaManagers !== undefined) {
            for (let i = 0; i < pgaManagers.length; i++) {
                if (pgaManagers[i] !== undefined) {
                    const manager = pgaManagers[i];
                    if (manager.getIsBusy()) {
                        if (manager.getCurrentOpportunityPools()[0].toLowerCase() === pooladdress.toLowerCase())
                            return true;
                        if (manager.getCurrentOpportunityPools()[1].toLowerCase() === pooladdress.toLowerCase())
                            return true;
                    }
                }
            }
        }
        return false;
    }
    return {
        shouldIgnoreNextBlock,
        updateMempoolBlock,
        pgaManagers,
        parseTransaction,
    };
}
exports.default = createMempoolManager;
