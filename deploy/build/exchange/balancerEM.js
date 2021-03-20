"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.balancerCreateReturnCall = exports.createReturnBalancerExchangeMatrix = exports.balancerCreateAwayCall = exports.createAwayBalancerExchangeMatrix = void 0;
const exchangeMatrix_1 = require("./exchangeMatrix");
const bignumber_js_1 = require("bignumber.js");
const web3ContractInit_1 = require("../web3ContractInit");
const { mainnet: addresses } = require('../addresses');
/**
 * Called somewhere inside of ExchangeMatrix.ts in order to call the generic createAwayExchangeMatrix() and
 * pass it the unique balancerCreateAwayCall method.
 * @param coinArray array of strings representing coins we are exchanging between
 * @param inputAmount number amount in usd of coins we want to plug into the arb
 * @param primaryCalls reference to the primaryCall list to be updated and later batched
 * @param secondaryCalls reference to the secondaryCall list to be updated and later batched (not required for balancer abi)
 * @param updateEntry opportunity maganer function to keep track of the return value
 * @returns void
 */
function createAwayBalancerExchangeMatrix(coinArray, inputAmount, primaryCalls, secondaryCalls, updateEntry) {
    exchangeMatrix_1.createAwayExchangeMatrix(coinArray, (fromCoin, toCoin) => {
        balancerCreateAwayCall(fromCoin, toCoin, inputAmount, primaryCalls, updateEntry);
    });
}
exports.createAwayBalancerExchangeMatrix = createAwayBalancerExchangeMatrix;
/**
 * Designed to be called from within createAwayExchangeMatrix() to update awayEMS with the away rate from balancer.
 * @param fromCoin input coin
 * @param toCoin output coin
 * @param inputAmount number amount in usd of coins we want to plug into the arb
 * @param primaryCalls reference to the primaryCall list to be updated and later batched
 * @param updateEntry opportunity maganer function to keep track of the return value
 * @returns void
 */
function balancerCreateAwayCall(fromCoin, toCoin, inputAmount, primaryCalls, updateEntry) {
    const srcToken = addresses.tokens[fromCoin];
    const destToken = addresses.tokens[toCoin];
    const input = new bignumber_js_1.BigNumber(inputAmount).shiftedBy(srcToken[1]).multipliedBy(srcToken[2]);
    const call = {
        ethCall: web3ContractInit_1.balancerExchangeProxy.methods.viewSplitExactIn(srcToken[0], destToken[0], input, 3).call,
        onSuccess: result => {
            const rate = new bignumber_js_1.BigNumber(result.totalOutput);
            const output = rate.integerValue();
            updateEntry(`balanceraway${fromCoin}${toCoin}`, { input, output });
        },
        onError: err => { }
    };
    primaryCalls.push(call);
}
exports.balancerCreateAwayCall = balancerCreateAwayCall;
/**
 * Called somewhere inside of ExchangeMatrix.ts in order to call the generic createReturnExchangeMatrix() and
 * pass it the unique balancerCreateReturnCall method.
 * @param coinArray array of strings representing coins we are exchanging between
 * @param exchangeMatrix the previous awayEM that we will use to get the input for this returnEM
 * @param primaryCalls reference to the primaryCall list to be updated and later batched
 * @param secondaryCalls reference to the secondaryCall list to be updated and later batched (not required for balancer abi)
 * @param updateEntry opportunity maganer function to keep track of the return value
 * @returns void
 */
function createReturnBalancerExchangeMatrix(coinArray, exchangeMatrix, primaryCalls, secondaryCalls, updateEntry) {
    exchangeMatrix_1.createReturnExchangeMatrix(coinArray, exchangeMatrix, (fromCoin, toCoin, input) => {
        balancerCreateReturnCall(fromCoin, toCoin, input, primaryCalls, updateEntry);
    });
}
exports.createReturnBalancerExchangeMatrix = createReturnBalancerExchangeMatrix;
/**
 * Designed to be called from within createReturnExchangeMatrix() to update returnEMS with the return rate from balancer.
 * @param fromCoin input coin
 * @param toCoin output coin
 * @param input bigNumber amount of coins (in from coin) we want to plug into the arb
 * @param primaryCalls reference to the primaryCall list to be updated and later batched
 * @param updateEntry opportunity maganer function to keep track of the return value
 * @returns void
 */
function balancerCreateReturnCall(fromCoin, toCoin, input, primaryCalls, updateEntry) {
    const srcToken = addresses.tokens[fromCoin];
    const destToken = addresses.tokens[toCoin];
    const call = {
        ethCall: web3ContractInit_1.balancerExchangeProxy.methods.viewSplitExactIn(srcToken[0], destToken[0], input, 3).call,
        onSuccess: result => {
            const rate = new bignumber_js_1.BigNumber(result.totalOutput);
            const output = rate.integerValue();
            updateEntry(`balancerreturn${toCoin}${fromCoin}`, { input, output });
        },
        onError: err => { }
    };
    primaryCalls.push(call);
}
exports.balancerCreateReturnCall = balancerCreateReturnCall;
