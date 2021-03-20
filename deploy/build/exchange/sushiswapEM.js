"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sushiswapCreateReturnCall = exports.createReturnSushiswapExchangeMatrix = exports.sushiswapCreateAwayCall = exports.createAwaySushiswapExchangeMatrix = void 0;
const exchangeMatrix_1 = require("./exchangeMatrix");
const bignumber_js_1 = require("bignumber.js");
const sdk_1 = require("@sushiswap/sdk");
const web3ContractInit_1 = require("../web3ContractInit");
const abis = require('../abis');
const { mainnet: addresses } = require('../addresses');
/**
 * Called somewhere inside of ExchangeMatrix.ts in order to call the generic createAwayExchangeMatrix() and
 * pass it the unique sushiSwapCreateAwayCall method.
 * @param coinArray array of strings representing coins we are exchanging between
 * @param inputAmount number amount in usd of coins we want to plug into the arb
 * @param primaryCalls reference to the primaryCall list to be updated and later batched
 * @param secondaryCalls reference to the secondaryCall list to be updated and later batched
 * @param updateEntry opportunity maganer function to keep track of the return value
 * @returns void
 */
function createAwaySushiswapExchangeMatrix(coinArray, inputAmount, primaryCalls, secondaryCalls, updateEntry) {
    exchangeMatrix_1.createAwayExchangeMatrix(coinArray, (fromCoin, toCoin) => {
        sushiswapCreateAwayCall(fromCoin, toCoin, inputAmount, primaryCalls, secondaryCalls, updateEntry);
    });
}
exports.createAwaySushiswapExchangeMatrix = createAwaySushiswapExchangeMatrix;
/**
 * Designed to be called from within createAwayExchangeMatrix() to update awayEMS with the away rate from sushiSwap.
 * @param fromCoin input coin
 * @param toCoin output coin
 * @param inputAmount number amount in usd of coins we want to plug into the arb
 * @param primaryCalls reference to the primaryCall list to be updated and later batched
 * @param secondaryCalls reference to the secondaryCall list to be updated and later batched
 * @param updateEntry opportunity maganer function to keep track of the return value
 * @returns void
 */
function sushiswapCreateAwayCall(fromCoin, toCoin, inputAmount, primaryCalls, secondaryCalls, updateEntry) {
    const srcToken = addresses.tokens[fromCoin];
    const destToken = addresses.tokens[toCoin];
    const tokenA = new sdk_1.Token(sdk_1.ChainId.MAINNET, srcToken[0], srcToken[1]);
    const tokenB = new sdk_1.Token(sdk_1.ChainId.MAINNET, destToken[0], destToken[1]);
    const call = {
        ethCall: web3ContractInit_1.sushiswapFactory.methods.getPair(srcToken[0], destToken[0]).call,
        onSuccess: pairAddress => {
            const sushiswapPairs = new web3ContractInit_1.web3.eth.Contract(abis.sushiswapPairs, pairAddress);
            const secondaryCall = {
                ethCall: sushiswapPairs.methods.getReserves().call,
                onSuccess: reserves => {
                    const reserve0 = reserves._reserve0;
                    const reserve1 = reserves._reserve1;
                    if (new bignumber_js_1.BigNumber(reserve0).isGreaterThan(10) && new bignumber_js_1.BigNumber(reserve1).isGreaterThan(10)) {
                        const tokens = [tokenA, tokenB];
                        const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]];
                        const pair = new sdk_1.Pair(new sdk_1.TokenAmount(token0, reserve0), new sdk_1.TokenAmount(token1, reserve1));
                        const route = new sdk_1.Route([pair], tokenA);
                        const input = new bignumber_js_1.BigNumber(inputAmount).shiftedBy(srcToken[1]).multipliedBy(srcToken[2]);
                        const trade = new sdk_1.Trade(route, new sdk_1.TokenAmount(tokenA, input.toString(10)), sdk_1.TradeType.EXACT_INPUT);
                        const rate = new bignumber_js_1.BigNumber(trade.executionPrice.toSignificant(destToken[1]));
                        const output = rate.multipliedBy(inputAmount).shiftedBy(destToken[1]).multipliedBy(srcToken[2]).integerValue();
                        updateEntry(`sushiswapaway${fromCoin}${toCoin}`, { input, output });
                    }
                },
                onError: err => { }
            };
            secondaryCalls.push(secondaryCall);
        }
    };
    primaryCalls.push(call);
}
exports.sushiswapCreateAwayCall = sushiswapCreateAwayCall;
/**
 * Called somewhere inside of ExchangeMatrix.ts in order to call the generic createReturnExchangeMatrix() and
 * pass it the unique sushiSwapCreateReturnCall method.
 * @param coinArray array of strings representing coins we are exchanging between
 * @param exchangeMatrix the previous awayEM that we will use to get the input for this returnEM
 * @param primaryCalls reference to the primaryCall list to be updated and later batched
 * @param secondaryCalls reference to the secondaryCall list to be updated and later batched
 * @param updateEntry opportunity maganer function to keep track of the return value
 * @returns void
 */
function createReturnSushiswapExchangeMatrix(coinArray, exchangeMatrix, primaryCalls, secondaryCalls, updateEntry) {
    exchangeMatrix_1.createReturnExchangeMatrix(coinArray, exchangeMatrix, (fromCoin, toCoin, input) => {
        sushiswapCreateReturnCall(fromCoin, toCoin, input, primaryCalls, secondaryCalls, updateEntry);
    });
}
exports.createReturnSushiswapExchangeMatrix = createReturnSushiswapExchangeMatrix;
/**
 * Designed to be called from within createReturnExchangeMatrix() to update returnEMS with the return rate from sushiSwap.
 * @param fromCoin input coin
 * @param toCoin output coin
 * @param input bigNumber amount of coins (in from coin) we want to plug into the arb
 * @param primaryCalls reference to the primaryCall list to be updated and later batched
 * @param secondaryCalls reference to the secondaryCall list to be updated and later batched
 * @param updateEntry opportunity maganer function to keep track of the return value
 * @returns void
 */
function sushiswapCreateReturnCall(fromCoin, toCoin, input, primaryCalls, secondaryCalls, updateEntry) {
    const srcToken = addresses.tokens[fromCoin];
    const destToken = addresses.tokens[toCoin];
    const tokenA = new sdk_1.Token(sdk_1.ChainId.MAINNET, srcToken[0], srcToken[1]);
    const tokenB = new sdk_1.Token(sdk_1.ChainId.MAINNET, destToken[0], destToken[1]);
    const call = {
        ethCall: web3ContractInit_1.sushiswapFactory.methods.getPair(srcToken[0], destToken[0]).call,
        onSuccess: pairAddress => {
            const sushiswapPairs = new web3ContractInit_1.web3.eth.Contract(abis.sushiswapPairs, pairAddress);
            const secondaryCall = {
                ethCall: sushiswapPairs.methods.getReserves().call,
                onSuccess: reserves => {
                    const reserve0 = reserves._reserve0;
                    const reserve1 = reserves._reserve1;
                    if (new bignumber_js_1.BigNumber(reserve0).isGreaterThan(10) && new bignumber_js_1.BigNumber(reserve1).isGreaterThan(10)) {
                        const tokens = [tokenA, tokenB];
                        const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]];
                        const pair = new sdk_1.Pair(new sdk_1.TokenAmount(token0, reserve0), new sdk_1.TokenAmount(token1, reserve1));
                        const route = new sdk_1.Route([pair], tokenA);
                        const trade = new sdk_1.Trade(route, new sdk_1.TokenAmount(tokenA, input.toString(10)), sdk_1.TradeType.EXACT_INPUT);
                        const rate = new bignumber_js_1.BigNumber(trade.executionPrice.toSignificant(18));
                        const output = rate.multipliedBy(input.shiftedBy(-srcToken[1])).shiftedBy(destToken[1]).integerValue();
                        updateEntry(`sushiswapreturn${toCoin}${fromCoin}`, { input, output });
                    }
                }
            };
            secondaryCalls.push(secondaryCall);
        },
        onError: err => { }
    };
    primaryCalls.push(call);
}
exports.sushiswapCreateReturnCall = sushiswapCreateReturnCall;
