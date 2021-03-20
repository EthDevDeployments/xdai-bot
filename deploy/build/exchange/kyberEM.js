"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kyberCreateReturnCall = exports.createReturnKyberExchangeMatrix = exports.kyberCreateAwayCall = exports.createAwayKyberExchangeMatrix = void 0;
const exchangeMatrix_1 = require("./exchangeMatrix");
const bignumber_js_1 = require("bignumber.js");
const web3ContractInit_1 = require("../web3ContractInit");
const { mainnet: addresses } = require('../addresses');
/**
 * Called somewhere inside of ExchangeMatrix.ts in order to call the generic createAwayExchangeMatrix() and
 * pass it the unique kyberCreateAwayCall method.
 * @param coinArray array of strings representing coins we are exchanging between
 * @param inputAmount number amount in usd of coins we want to plug into the arb
 * @param primaryCalls reference to the primaryCall list to be updated and later batched
 * @param secondaryCalls reference to the secondaryCall list to be updated and later batched (not required for kyber abi)
 * @param updateEntry opportunity maganer function to keep track of the return value
 * @returns void
 */
function createAwayKyberExchangeMatrix(coinArray, inputAmount, primaryCalls, secondaryCalls, updateEntry) {
    exchangeMatrix_1.createAwayExchangeMatrix(coinArray, (fromCoin, toCoin) => {
        kyberCreateAwayCall(fromCoin, toCoin, inputAmount, primaryCalls, updateEntry);
    });
}
exports.createAwayKyberExchangeMatrix = createAwayKyberExchangeMatrix;
/**
 * Designed to be called from within createAwayExchangeMatrix() to update awayEMS with the away rate from kyber.
 * @param fromCoin input coin
 * @param toCoin output coin
 * @param inputAmount number amount in usd of coins we want to plug into the arb
 * @param primaryCalls reference to the primaryCall list to be updated and later batched
 * @param updateEntry opportunity maganer function to keep track of the return value
 * @returns void
 */
function kyberCreateAwayCall(fromCoin, toCoin, inputAmount, primaryCalls, updateEntry) {
    const srcToken = addresses.tokens[fromCoin];
    const destToken = addresses.tokens[toCoin];
    const input = new bignumber_js_1.BigNumber(inputAmount).shiftedBy(srcToken[1]).multipliedBy(srcToken[2]);
    const call = {
        ethCall: web3ContractInit_1.kyber.methods.getExpectedRate(srcToken[0], destToken[0], input).call,
        onSuccess: result => {
            const rate = new bignumber_js_1.BigNumber(result.expectedRate).shiftedBy(destToken[1] - 18);
            const output = rate.multipliedBy(inputAmount).multipliedBy(srcToken[2]).integerValue();
            if (output.isGreaterThan(0)) {
                updateEntry(`kyberaway${fromCoin}${toCoin}`, { input, output });
            }
        },
        onError: err => { }
    };
    primaryCalls.push(call);
}
exports.kyberCreateAwayCall = kyberCreateAwayCall;
/**
 * Called somewhere inside of ExchangeMatrix.ts in order to call the generic createReturnExchangeMatrix() and
 * pass it the unique kyberCreateReturnCall method.
 * @param coinArray array of strings representing coins we are exchanging between
 * @param exchangeMatrix the previous awayEM that we will use to get the input for this returnEM
 * @param primaryCalls reference to the primaryCall list to be updated and later batched
 * @param secondaryCalls reference to the secondaryCall list to be updated and later batched (not required for kyber abi)
 * @param updateEntry opportunity maganer function to keep track of the return value
 * @returns void
 */
function createReturnKyberExchangeMatrix(coinArray, exchangeMatrix, primaryCalls, secondaryCalls, updateEntry) {
    exchangeMatrix_1.createReturnExchangeMatrix(coinArray, exchangeMatrix, (fromCoin, toCoin, input) => {
        kyberCreateReturnCall(fromCoin, toCoin, input, primaryCalls, updateEntry);
    });
}
exports.createReturnKyberExchangeMatrix = createReturnKyberExchangeMatrix;
/**
 * Designed to be called from within createReturnExchangeMatrix() to update returnEMS with the return rate from kyber.
 * @param fromCoin input coin
 * @param toCoin output coin
 * @param input bigNumber amount of coins (in from coin) we want to plug into the arb
 * @param primaryCalls reference to the primaryCall list to be updated and later batched
 * @param updateEntry opportunity maganer function to keep track of the return value
 * @returns void
 */
function kyberCreateReturnCall(fromCoin, toCoin, input, primaryCalls, updateEntry) {
    const srcToken = addresses.tokens[fromCoin];
    const destToken = addresses.tokens[toCoin];
    const call = {
        ethCall: web3ContractInit_1.kyber.methods.getExpectedRate(srcToken[0], destToken[0], input.integerValue()).call,
        onSuccess: result => {
            const rate = new bignumber_js_1.BigNumber(result.expectedRate).shiftedBy(destToken[1] - 18);
            const output = rate.multipliedBy(input.shiftedBy(-srcToken[1])).integerValue();
            if (output.isGreaterThan(0)) {
                updateEntry(`kyberreturn${toCoin}${fromCoin}`, { input, output });
            }
        },
        onError: err => { }
    };
    primaryCalls.push(call);
}
exports.kyberCreateReturnCall = kyberCreateReturnCall;
