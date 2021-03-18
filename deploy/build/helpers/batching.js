"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepBatchRequest = exports.batchRequest = void 0;
const { makeBatchRequest } = require('web3-batch-request');
async function batchRequest(primaryCalls, chain) {
    await makeBatchRequest(chain.web3, primaryCalls, { allowFailures: true, verbose: false });
}
exports.batchRequest = batchRequest;
async function deepBatchRequest(primaryCalls, secondaryCalls, chain) {
    await makeBatchRequest(chain.web3, primaryCalls, { allowFailures: true, verbose: false });
    if (secondaryCalls.length > 0) {
        await makeBatchRequest(chain.web3, secondaryCalls, { allowFailures: true, verbose: false });
    }
}
exports.deepBatchRequest = deepBatchRequest;
