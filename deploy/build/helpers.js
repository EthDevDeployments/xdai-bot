"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProfit = exports.coinToDai = exports.gasPriceWei = exports.toRate = exports.bestOpportunity = exports.ObjFrom2Arrays = void 0;
const bignumber_1 = require("@balancer-labs/sor/dist/utils/bignumber");
const sdk_1 = require("@uniswap/sdk");
const xmlhttprequest_1 = require("xmlhttprequest");
const abis = require('./abis');
const { mainnet: addresses } = require('./addresses');
const run_arbitrage_1 = require("./run-arbitrage");
function ObjFrom2Arrays(keys, entries) {
    if (keys.length === entries.length) {
        return Object.fromEntries(keys.map((id, index) => {
            return [id, entries[index]];
        }));
    }
    return {};
}
exports.ObjFrom2Arrays = ObjFrom2Arrays;
async function bestOpportunity(opportunities, admin) {
    let maxDiff = new bignumber_1.BigNumber(0);
    let bestTx = null;
    let bestGasAmount = 0;
    opportunities.forEach(async (opportunity) => {
        const tx = run_arbitrage_1.ethDevContract.methods.initiateFlashLoan(addresses.contracts["dydx"], addresses.tokens[opportunity.coins[0]][0], addresses.tokens[opportunity.coins[1]][0], opportunity.inputAmount.shiftedBy(addresses.tokens[opportunity.coins[0]][1]).toString(), addresses.contracts[opportunity.exchanges[0]], addresses.contracts[opportunity.exchanges[1]]);
        //Estimate gas used by contract
        const gasAmount = await tx.estimateGas({ from: admin });
        let difference = await calculateProfit(opportunity, gasAmount);
        if (difference.isGreaterThan(maxDiff)) {
            maxDiff = difference;
            bestTx = tx;
            bestGasAmount = gasAmount;
        }
    });
    if (bestTx != null) {
        return {
            bestTx,
            bestGasAmount
        };
    }
    else {
        return null;
    }
}
exports.bestOpportunity = bestOpportunity;
function toRate(amtWei, numDecimals) {
    return amtWei.shiftedBy(-numDecimals);
}
exports.toRate = toRate;
function gasPriceWei(fastest) {
    var Httpreq = new xmlhttprequest_1.XMLHttpRequest(); // a new request
    Httpreq.open("GET", "https://ethgasstation.info/api/ethgasAPI.json?api-key=e5f795b727d73a876412a4b53bb18ba187af3e22b5030cd25758c1330b2e", false);
    Httpreq.send(null);
    var parsedGasData = JSON.parse(Httpreq.responseText);
    if (fastest) {
        return new bignumber_1.BigNumber(parsedGasData.fastest).shiftedBy(-10); //make sure this is right
    }
    else {
        return new bignumber_1.BigNumber(parsedGasData.average).shiftedBy(-10);
    }
}
exports.gasPriceWei = gasPriceWei;
async function coinToDai(coin, inputAmount) {
    const srcToken = addresses.tokens["dai"];
    const destToken = addresses.tokens[coin];
    const tokenA = new sdk_1.Token(sdk_1.ChainId.MAINNET, srcToken[0], srcToken[1]);
    const tokenB = new sdk_1.Token(sdk_1.ChainId.MAINNET, destToken[0], destToken[1]);
    if (coin == "dai") {
        return inputAmount;
    }
    try {
        const pairAddress = await run_arbitrage_1.uniswapFactory.methods.getPair(srcToken[0], destToken[0]).call();
        const uniswapPairs = new run_arbitrage_1.web3.eth.Contract(abis.uniswapPairs, pairAddress);
        const reserves = await uniswapPairs.methods.getReserves().call();
        const reserve0 = reserves._reserve0;
        const reserve1 = reserves._reserve1;
        const tokens = [tokenA, tokenB];
        const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]];
        const pair = new sdk_1.Pair(new sdk_1.TokenAmount(token0, reserve0), new sdk_1.TokenAmount(token1, reserve1));
        const route = new sdk_1.Route([pair], tokenA);
        const input = new bignumber_1.BigNumber(1).shiftedBy(srcToken[1]);
        const trade = new sdk_1.Trade(route, new sdk_1.TokenAmount(tokenA, input.toString(10)), sdk_1.TradeType.EXACT_INPUT);
        const rate = new bignumber_1.BigNumber(trade.executionPrice.toSignificant(destToken[1]));
        return inputAmount.dividedBy(rate);
    }
    catch (coinDoesntExist) {
        return new bignumber_1.BigNumber(0);
    }
}
exports.coinToDai = coinToDai;
async function calculateProfit(ourBestOpportunity, gasAmount) {
    var gasPrice = gasPriceWei(false);
    var gasPriceDai = await coinToDai("weth", gasPrice);
    var arbDiffDai = await coinToDai(ourBestOpportunity.coins[0], ourBestOpportunity.difference);
    return arbDiffDai.minus(gasPriceDai.multipliedBy(gasAmount));
}
exports.calculateProfit = calculateProfit;
