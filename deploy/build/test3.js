"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mempoolManager_1 = __importDefault(require("./helpers/mempoolManager"));
const opportunityManager_1 = __importDefault(require("./helpers/opportunityManager"));
const xDaiConfig_1 = require("./xDaiConfig");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
console.log('starting');
const init = async () => {
    var blockNumber = 0;
    const { parseTransaction, evaluateOpportunity } = mempoolManager_1.default(xDaiConfig_1.chain);
    // web3.eth.subscribe('pendingTransactions').on('data', async function (transaction) {
    // 	parseTransaction(transaction, blockNumber)
    // })
    const { createOpportunityBatchList, executeLoadedBatch } = opportunityManager_1.default(evaluateOpportunity, xDaiConfig_1.chain);
    createOpportunityBatchList();
    xDaiConfig_1.chain.web3.eth.subscribe('newBlockHeaders').on('data', async (block) => {
        console.log(block.number);
        if (block.number > blockNumber) {
            blockNumber = block.number;
        }
        console.time('opportunities');
        executeLoadedBatch();
        console.timeEnd('opportunities');
    });
};
init();
