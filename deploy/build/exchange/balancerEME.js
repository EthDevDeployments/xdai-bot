"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.balancerCreateReturnEntryCall = exports.balancerCreateAwayEntryCall = void 0;
const bignumber_1 = require("@balancer-labs/sor/dist/utils/bignumber");
const web3ContractInit_1 = require("../web3ContractInit");
const { mainnet: addresses } = require('../addresses');
function balancerCreateAwayEntryCall(fromCoin, toCoin, inputAmount, calls, secondaryCalls, awayEntries, i) {
    const srcToken = addresses.tokens[fromCoin];
    const destToken = addresses.tokens[toCoin];
    const input = new bignumber_1.BigNumber(inputAmount).shiftedBy(srcToken[1]).multipliedBy(srcToken[2]);
    const call = {
        ethCall: web3ContractInit_1.balancerExchangeProxy.methods.viewSplitExactIn(srcToken[0], destToken[0], input, 3).call,
        onSuccess: result => {
            const rate = new bignumber_1.BigNumber(result.totalOutput);
            const output = rate.integerValue();
            awayEntries[i] = { input, output };
        }
    };
    calls.push(call);
}
exports.balancerCreateAwayEntryCall = balancerCreateAwayEntryCall;
function balancerCreateReturnEntryCall(fromCoin, toCoin, input, calls, secondaryCalls, returnEntries, i) {
    const srcToken = addresses.tokens[fromCoin];
    const destToken = addresses.tokens[toCoin];
    const call = {
        ethCall: web3ContractInit_1.balancerExchangeProxy.methods.viewSplitExactIn(srcToken[0], destToken[0], input, 3).call,
        onSuccess: result => {
            const rate = new bignumber_1.BigNumber(result.totalOutput);
            const output = rate.integerValue();
            returnEntries[i] = { input, output };
        }
    };
    calls.push(call);
}
exports.balancerCreateReturnEntryCall = balancerCreateReturnEntryCall;
