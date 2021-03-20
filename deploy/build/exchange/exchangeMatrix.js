"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEM = exports.gatherOpportunities = exports.createReturnExchangeMatrix = exports.createAwayExchangeMatrix = void 0;
const bignumber_js_1 = require("bignumber.js");
const kyberEM_1 = require("./kyberEM");
const uniswapEM_1 = require("./uniswapEM");
const balancerEM_1 = require("./balancerEM");
const sushiswapEM_1 = require("./sushiswapEM");
const transactions_1 = require("../helpers/transactions");
const { mainnet: addresses } = require('../addresses');
/**
 * @param coinArray array of strings representing coins we are exchanging between
 * @param getAwayRate a function that takes as input: 2 strings referring to coins
 * in coin array and their respective indicies that will be used to update the EM
 * @returns void
 */
function createAwayExchangeMatrix(coinArray, UpdateAwayRate) {
    coinArray.forEach(iCoin => {
        if (iCoin == 'weth' || iCoin == 'dai' || iCoin == 'usdc') {
            coinArray.forEach(jCoin => {
                if (iCoin !== jCoin) {
                    UpdateAwayRate(iCoin, jCoin);
                }
            });
        }
    });
}
exports.createAwayExchangeMatrix = createAwayExchangeMatrix;
/**
 * @param coinArray array of strings representing coins we are exchanging between
 * @param exchangeMatrix the awayExchangeMatrix (the first exchange step)
 * @param getReturnRate a function that takes as input: 2 strings referring to coins
 * in coin array, their respective indicies that will be used to update the EM,
 * and the input amount as a bigNum
 * @returns void
 */
function createReturnExchangeMatrix(coinArray, exchangeMatrix, getReturnRate) {
    coinArray.forEach((iCoin, i) => {
        if (iCoin == 'weth' || iCoin == 'dai' || iCoin == 'usdc') {
            coinArray.forEach((jCoin, j) => {
                const emEntry = exchangeMatrix[i][j];
                if (emEntry && iCoin !== jCoin) {
                    getReturnRate(jCoin, iCoin, emEntry.output); // from jCoin to iCoin this time
                }
            });
        }
    });
}
exports.createReturnExchangeMatrix = createReturnExchangeMatrix;
/**
 * A method that gathers all arbitrage opportunities available. It can show all opportunities
 * or only those that are profitable.
 * (all the call arrays and EMs are passed by reference so that asyncronous
 * callbacks can push their outputs to them)
 * @param exchangeArray an array of exchanges we would like to trade between
 * @param coinArray array of strings representing coins we are exchanging between
 * @param amount amount in usd to use as input
 * @param showAll show all opportunities (even those with negative returns)
 * @returns An array of favorable exchanges
 */
async function gatherOpportunities(exchanges, coinArray, amount, resetEntries, getEM, updateEntry, createEMs, showAll) {
    const opportunities = [];
    var primaryAwayCalls = [];
    var secondaryAwayCalls = [];
    var primaryReturnCalls = [];
    var secondaryReturnCalls = [];
    resetEntries(exchanges, coinArray);
    exchanges.forEach(awayExchange => {
        exports.createEM[`${awayExchange}Away`](coinArray, amount, primaryAwayCalls, secondaryAwayCalls, updateEntry);
    });
    console.time(`B1`);
    await transactions_1.makeBatchReq(primaryAwayCalls, secondaryAwayCalls);
    console.timeEnd(`B1`);
    createEMs(exchanges, 'away', coinArray);
    exchanges.forEach(returnExchange => {
        exchanges.forEach(EM1id => {
            exports.createEM[`${returnExchange}Return`](coinArray, getEM(EM1id, 'away'), primaryReturnCalls, secondaryReturnCalls, updateEntry);
        });
    });
    console.time(`B2`);
    await transactions_1.makeBatchReq(primaryReturnCalls, secondaryReturnCalls);
    console.timeEnd(`B2`);
    createEMs(exchanges, 'return', coinArray);
    exchanges.forEach(EM1id => {
        exchanges.forEach(EM2id => {
            addToOpportunities(coinArray, EM1id, getEM(EM1id, 'away'), EM2id, getEM(EM2id, 'return'), opportunities, showAll);
        });
    });
    return opportunities;
}
exports.gatherOpportunities = gatherOpportunities;
/**
 * @param coinArray array of strings representing coins we are exchanging between
 * @param awayEMid string identifier of the awayExchangeMatrix step
 * @param awayEM the current awayExchangeMatrix step
 * @param returnEMid string identifier of the returnExchangeMatrix step
 * @param returnEM the current returnExchangeMatrix step
 * @param opportunities the favorableExchange list that is passed by reference so that it may be updated deeper in the method
 * @param showNeg show all opportunities (even those with negative returns)
 * @returns void
 */
function addToOpportunities(coinArray, awayEMid, awayEM, returnEMid, returnEM, opportunities, showNeg) {
    coinArray.forEach((iCoin, i) => {
        coinArray.forEach((jCoin, j) => {
            const awayEntry = awayEM[i][j];
            const returnEntry = returnEM[i][j];
            if (iCoin !== jCoin && awayEM != null && returnEM != null && awayEntry && returnEntry) {
                const dif = returnEntry.output.minus(awayEntry.input).integerValue();
                const difNum = dif.toNumber();
                if (showNeg || difNum > 0) {
                    const coinDif = dif.shiftedBy(-addresses.tokens[iCoin][1]);
                    opportunities.push({
                        coins: [iCoin, jCoin],
                        exchanges: [awayEMid, returnEMid],
                        inputAmount: new bignumber_js_1.BigNumber(awayEntry.input.shiftedBy(-addresses.tokens[iCoin][1]).toFixed(addresses.tokens[iCoin][1])),
                        middleAmount: new bignumber_js_1.BigNumber(awayEntry.output.shiftedBy(-addresses.tokens[jCoin][1]).toFixed(addresses.tokens[jCoin][1])),
                        outputAmount: new bignumber_js_1.BigNumber(returnEntry.output.shiftedBy(-addresses.tokens[iCoin][1]).toFixed(addresses.tokens[iCoin][1])),
                        difference: coinDif,
                        optimized: false
                    });
                }
            }
        });
    });
}
exports.createEM = {
    'kyberAway': kyberEM_1.createAwayKyberExchangeMatrix,
    'kyberReturn': kyberEM_1.createReturnKyberExchangeMatrix,
    'uniswapAway': uniswapEM_1.createAwayUniswapExchangeMatrix,
    'uniswapReturn': uniswapEM_1.createReturnUniswapExchangeMatrix,
    'balancerAway': balancerEM_1.createAwayBalancerExchangeMatrix,
    'balancerReturn': balancerEM_1.createReturnBalancerExchangeMatrix,
    'sushiswapAway': sushiswapEM_1.createAwaySushiswapExchangeMatrix,
    'sushiswapReturn': sushiswapEM_1.createReturnSushiswapExchangeMatrix
};
