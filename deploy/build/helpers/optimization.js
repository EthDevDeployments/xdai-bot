"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimize = exports.createEME = void 0;
const logging_1 = require("./logging");
const bignumber_js_1 = require("bignumber.js");
const balancerEME_1 = require("../exchange/balancerEME");
const kyberEME_1 = require("../exchange/kyberEME");
const sushiswapEME_1 = require("../exchange/sushiswapEME");
const uniswapEME_1 = require("../exchange/uniswapEME");
const transactions_1 = require("./transactions");
const { mainnet: addresses } = require('../addresses');
exports.createEME = {
    'kyberAway': kyberEME_1.kyberCreateAwayEntryCall,
    'kyberReturn': kyberEME_1.kyberCreateReturnEntryCall,
    'uniswapAway': uniswapEME_1.uniswapCreateAwayEntryCall,
    'uniswapReturn': uniswapEME_1.uniswapCreateReturnEntryCall,
    'balancerAway': balancerEME_1.balancerCreateAwayEntryCall,
    'balancerReturn': balancerEME_1.balancerCreateReturnEntryCall,
    'sushiswapAway': sushiswapEME_1.sushiswapCreateAwayEntryCall,
    'sushiswapReturn': sushiswapEME_1.sushiswapCreateReturnEntryCall
};
/**
 * This method calculates the nextArray from the current array, using the multiplicand to update input.
 * If an entry in the nextArray does not improve then the current entry will replace it and it will be refered to
 * as "optimized".
 * @param currentArray the current array of favorable exchanges
 * @param multiplicand the amount to multiply the previous input by in the next iteration
 * @returns the optimized nextArray
 */
async function batchEntries(currentArray, multiplicand) {
    var awayEntries = currentArray.map(() => { return { input: new bignumber_js_1.BigNumber(0), output: new bignumber_js_1.BigNumber(0) }; });
    var returnEntries = currentArray.map(() => { return { input: new bignumber_js_1.BigNumber(0), output: new bignumber_js_1.BigNumber(0) }; });
    var primaryAwayCalls = [];
    var primaryReturnCalls = [];
    var secondaryAwayCalls = [];
    var secondaryReturnCalls = [];
    currentArray.forEach((FE, i) => {
        exports.createEME[`${FE.exchanges[0]}Away`](FE.coins[0], FE.coins[1], FE.inputAmount.multipliedBy(multiplicand).toNumber(), primaryAwayCalls, secondaryAwayCalls, awayEntries, i);
    });
    await transactions_1.makeBatchReq(primaryAwayCalls, secondaryAwayCalls);
    currentArray.forEach((FE, i) => {
        exports.createEME[`${FE.exchanges[1]}Return`](FE.coins[1], FE.coins[0], awayEntries[i].output, primaryReturnCalls, secondaryReturnCalls, returnEntries, i);
    });
    await transactions_1.makeBatchReq(primaryReturnCalls, secondaryReturnCalls);
    var FEOut = [];
    currentArray.forEach((FE, i) => {
        const dif = returnEntries[i].output.minus(awayEntries[i].input).shiftedBy(-addresses.tokens[FE.coins[0]][1]);
        if (FE.optimized) {
            FEOut.push(FE);
        }
        else if (dif.isLessThan(FE.difference) || dif.isLessThanOrEqualTo(0)) {
            FEOut.push({
                coins: FE.coins,
                exchanges: FE.exchanges,
                inputAmount: FE.inputAmount,
                middleAmount: FE.middleAmount,
                outputAmount: FE.outputAmount,
                difference: FE.difference,
                optimized: true
            });
        }
        else {
            FEOut.push({
                coins: FE.coins,
                exchanges: FE.exchanges,
                inputAmount: awayEntries[i].input.shiftedBy(-addresses.tokens[FE.coins[0]][1]),
                middleAmount: awayEntries[i].output.shiftedBy(-addresses.tokens[FE.coins[1]][1]),
                outputAmount: returnEntries[i].output.shiftedBy(-addresses.tokens[FE.coins[0]][1]),
                difference: dif,
                optimized: false
            });
        }
    });
    return FEOut;
}
/**
 * This method aims to maximize the arbitrage discrepancy by increasing the input amount
 * until the discrepency starts to decrease.
 * @param prevArray the previous array of favorable exchanges
 * @param currentArray the current array of favorable exchanges
 * @param multiplicand the amount to multiply the previous input by in the next iteration
 * @param logging whether to log each iteration of the method
 * @returns the optimized array
 */
async function optimize(prevArray, currentArray, multiplicand, logging) {
    if (prevArray.length > 0) {
        if (currentArray == null) {
            currentArray = await batchEntries(prevArray, multiplicand);
        }
        let complete = true;
        currentArray.forEach(exchange => {
            if (!exchange.optimized) {
                complete = false;
            }
        });
        if (!complete) {
            var nextArray = await batchEntries(currentArray, multiplicand);
            if (logging) {
                logging_1.logOpportunities(currentArray);
            }
            return await optimize(currentArray, nextArray, multiplicand, logging);
        }
        else {
            return currentArray;
        }
    }
    else {
        return prevArray;
    }
}
exports.optimize = optimize;
