"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimize = exports.createEME = void 0;
const logging_1 = require("../helpers/logging");
const bignumber_js_1 = require("bignumber.js");
const web3ContractInit_1 = require("../web3ContractInit");
const balancerEME_1 = require("./balancerEME");
const kyberEME_1 = require("./kyberEME");
const sushiswapEME_1 = require("./sushiswapEME");
const uniswapEME_1 = require("./uniswapEME");
const { makeBatchRequest } = require('web3-batch-request');
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
async function batchEntries(currentArray, increment) {
    var awayEntries = currentArray.map(() => { return { input: new bignumber_js_1.BigNumber(0), output: new bignumber_js_1.BigNumber(0) }; });
    var returnEntries = currentArray.map(() => { return { input: new bignumber_js_1.BigNumber(0), output: new bignumber_js_1.BigNumber(0) }; });
    var awayCalls = [];
    var returnCalls = [];
    var secondaryAwayCalls = [];
    var secondaryReturnCalls = [];
    currentArray.forEach((FE, i) => {
        exports.createEME[`${FE.exchanges[0]}Away`](FE.coins[0], FE.coins[1], FE.inputAmount.multipliedBy(increment).toNumber(), awayCalls, secondaryAwayCalls, awayEntries, i);
    });
    try {
        await makeBatchRequest(web3ContractInit_1.web3, awayCalls);
        if (secondaryAwayCalls.length > 0) {
            await makeBatchRequest(web3ContractInit_1.web3, secondaryAwayCalls);
        }
    }
    catch (error) {
        console.log(error);
    }
    currentArray.forEach((FE, i) => {
        exports.createEME[`${FE.exchanges[1]}Return`](FE.coins[1], FE.coins[0], awayEntries[i].output, returnCalls, secondaryReturnCalls, returnEntries, i);
    });
    try {
        await makeBatchRequest(web3ContractInit_1.web3, returnCalls);
        if (secondaryReturnCalls.length > 0) {
            await makeBatchRequest(web3ContractInit_1.web3, secondaryReturnCalls);
        }
    }
    catch (error) {
        console.log(error);
    }
    var FEOut = [];
    currentArray.forEach((FE, i) => {
        const dif = returnEntries[i].output.minus(awayEntries[i].input).shiftedBy(-addresses.tokens[FE.coins[0]][1]);
        if (FE.optimized) {
            FEOut.push(FE);
        }
        else if (dif.isLessThan(FE.difference)) {
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
async function optimize(prevArray, currentArray, increment, stopValue, logging) {
    if (prevArray.length > 0) {
        if (currentArray == null) {
            currentArray = await batchEntries(prevArray, increment);
        }
        let complete = true;
        currentArray.forEach(exchange => {
            if (!exchange.optimized) {
                complete = false;
            }
        });
        if (!complete) {
            var nextArray = await batchEntries(currentArray, increment);
            if (logging) {
                logging_1.logOpportunities(currentArray);
            }
            return await optimize(currentArray, nextArray, increment, stopValue, logging);
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
