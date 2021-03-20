"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kyberCreateReturnEntryCall = exports.kyberCreateAwayEntryCall = void 0;
const bignumber_1 = require("@balancer-labs/sor/dist/utils/bignumber");
const web3ContractInit_1 = require("../web3ContractInit");
const { mainnet: addresses } = require('../addresses');
function kyberCreateAwayEntryCall(fromCoin, toCoin, inputAmount, calls, secondaryCalls, awayEntries, i) {
    const srcToken = addresses.tokens[fromCoin];
    const destToken = addresses.tokens[toCoin];
    const input = new bignumber_1.BigNumber(inputAmount).shiftedBy(srcToken[1]).multipliedBy(srcToken[2]);
    const call = {
        ethCall: web3ContractInit_1.kyber.methods.getExpectedRate(srcToken[0], destToken[0], input).call,
        onSuccess: result => {
            const rate = new bignumber_1.BigNumber(result.expectedRate).shiftedBy(destToken[1] - 18);
            const output = rate.multipliedBy(inputAmount).multipliedBy(srcToken[2]).integerValue();
            if (output.isGreaterThan(0)) {
                awayEntries[i] = { input, output };
            }
        }
    };
    calls.push(call);
}
exports.kyberCreateAwayEntryCall = kyberCreateAwayEntryCall;
function kyberCreateReturnEntryCall(fromCoin, toCoin, input, calls, secondaryCalls, returnEntries, i) {
    const srcToken = addresses.tokens[fromCoin];
    const destToken = addresses.tokens[toCoin];
    const call = {
        ethCall: web3ContractInit_1.kyber.methods.getExpectedRate(srcToken[0], destToken[0], input).call,
        onSuccess: result => {
            const rate = new bignumber_1.BigNumber(result.expectedRate).shiftedBy(destToken[1] - 18);
            const output = rate.multipliedBy(input.shiftedBy(-srcToken[1])).integerValue();
            if (output.isGreaterThan(0)) {
                returnEntries[i] = { input, output };
            }
        }
    };
    calls.push(call);
}
exports.kyberCreateReturnEntryCall = kyberCreateReturnEntryCall;
