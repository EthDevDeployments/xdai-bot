"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mempoolManager_1 = __importDefault(require("./helpers/mempoolManager"));
const opportunityManager_1 = __importDefault(require("./helpers/opportunityManager"));
const mainnetConfig_1 = require("./mainnetConfig");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
console.log('starting');
const init = async () => {
    let blockNumber = 0;
    const { shouldIgnoreNextBlock, updateMempoolBlock, pgaManagers, parseTransaction } = mempoolManager_1.default(mainnetConfig_1.chain);
    // chain.web3.eth.subscribe('pendingTransactions').on('data', async function (transaction) {
    // 	parseTransaction(transaction)
    // })
    const { createOpportunityBatchList, executeLoadedBatch, opportunityParams } = opportunityManager_1.default(pgaManagers, shouldIgnoreNextBlock, mainnetConfig_1.chain);
    await createOpportunityBatchList();
    console.log(opportunityParams.pairs);
    mainnetConfig_1.chain.web3.eth.subscribe('newBlockHeaders').on('data', async (block) => {
        console.log(`Block Number ${block.number}`);
        if (block.number > blockNumber) {
            blockNumber = block.number;
            await updateMempoolBlock(blockNumber);
        }
        executeLoadedBatch();
    });
};
init();
