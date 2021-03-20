"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniswapCreateReturnEntryCall = exports.uniswapCreateAwayEntryCall = void 0;
const bignumber_1 = require("@balancer-labs/sor/dist/utils/bignumber");
const sdk_1 = require("@uniswap/sdk");
const web3ContractInit_1 = require("../web3ContractInit");
const abis = require('../abis');
const { mainnet: addresses } = require('../addresses');
function uniswapCreateAwayEntryCall(fromCoin, toCoin, inputAmount, calls, secondaryCalls, awayEntries, i) {
    const srcToken = addresses.tokens[fromCoin];
    const destToken = addresses.tokens[toCoin];
    const tokenA = new sdk_1.Token(sdk_1.ChainId.MAINNET, srcToken[0], srcToken[1]);
    const tokenB = new sdk_1.Token(sdk_1.ChainId.MAINNET, destToken[0], destToken[1]);
    const call = {
        ethCall: web3ContractInit_1.uniswapFactory.methods.getPair(srcToken[0], destToken[0]).call,
        onSuccess: pairAddress => {
            const uniswapPairs = new web3ContractInit_1.web3.eth.Contract(abis.uniswapPairs, pairAddress);
            const secondaryCall = {
                ethCall: uniswapPairs.methods.getReserves().call,
                onSuccess: reserves => {
                    const reserve0 = reserves._reserve0;
                    const reserve1 = reserves._reserve1;
                    const tokens = [tokenA, tokenB];
                    const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]];
                    const pair = new sdk_1.Pair(new sdk_1.TokenAmount(token0, reserve0), new sdk_1.TokenAmount(token1, reserve1));
                    const route = new sdk_1.Route([pair], tokenA);
                    const input = new bignumber_1.BigNumber(inputAmount).shiftedBy(srcToken[1]).multipliedBy(srcToken[2]);
                    const trade = new sdk_1.Trade(route, new sdk_1.TokenAmount(tokenA, input.toString(10)), sdk_1.TradeType.EXACT_INPUT);
                    const rate = new bignumber_1.BigNumber(trade.executionPrice.toSignificant(destToken[1]));
                    const output = rate.multipliedBy(inputAmount).shiftedBy(destToken[1]).multipliedBy(srcToken[2]).integerValue();
                    awayEntries[i] = { input, output };
                }
            };
            secondaryCalls.push(secondaryCall);
        }
    };
    calls.push(call);
}
exports.uniswapCreateAwayEntryCall = uniswapCreateAwayEntryCall;
function uniswapCreateReturnEntryCall(fromCoin, toCoin, input, calls, secondaryCalls, returnEntries, i) {
    const srcToken = addresses.tokens[fromCoin];
    const destToken = addresses.tokens[toCoin];
    const tokenA = new sdk_1.Token(sdk_1.ChainId.MAINNET, srcToken[0], srcToken[1]);
    const tokenB = new sdk_1.Token(sdk_1.ChainId.MAINNET, destToken[0], destToken[1]);
    const call = {
        ethCall: web3ContractInit_1.uniswapFactory.methods.getPair(srcToken[0], destToken[0]).call,
        onSuccess: pairAddress => {
            const uniswapPairs = new web3ContractInit_1.web3.eth.Contract(abis.uniswapPairs, pairAddress);
            const secondaryCall = {
                ethCall: uniswapPairs.methods.getReserves().call,
                onSuccess: reserves => {
                    const reserve0 = reserves._reserve0;
                    const reserve1 = reserves._reserve1;
                    const tokens = [tokenA, tokenB];
                    const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]];
                    const pair = new sdk_1.Pair(new sdk_1.TokenAmount(token0, reserve0), new sdk_1.TokenAmount(token1, reserve1));
                    const route = new sdk_1.Route([pair], tokenA);
                    const trade = new sdk_1.Trade(route, new sdk_1.TokenAmount(tokenA, input.toString(10)), sdk_1.TradeType.EXACT_INPUT);
                    const rate = new bignumber_1.BigNumber(trade.executionPrice.toSignificant(18));
                    const output = rate.multipliedBy(input.shiftedBy(-srcToken[1])).shiftedBy(destToken[1]).integerValue();
                    returnEntries[i] = { input, output };
                }
            };
            secondaryCalls.push(secondaryCall);
        }
    };
    calls.push(call);
}
exports.uniswapCreateReturnEntryCall = uniswapCreateReturnEntryCall;
