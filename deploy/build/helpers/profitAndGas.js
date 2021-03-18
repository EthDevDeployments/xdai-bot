"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimate = exports.gasPriceWei = exports.profitable = void 0;
const bignumber_1 = require("@balancer-labs/sor/dist/utils/bignumber");
const xmlhttprequest_1 = require("xmlhttprequest");
const abis = require('../abis');
const { mainnet: addresses } = require('../addresses');
const { makeBatchRequest } = require('web3-batch-request');
async function profitable(opportunity, gasPrice) {
    const totalGasCostWei = estimate(opportunity.awayExchange, opportunity.returnExchange).multipliedBy(gasPrice);
    const revenueInWei = new bignumber_1.BigNumber(opportunity.stdDiff);
    if (revenueInWei.isGreaterThan(totalGasCostWei)) {
        return true;
    }
    else {
        return false;
    }
}
exports.profitable = profitable;
function gasPriceWei(fastest) {
    var Httpreq = new xmlhttprequest_1.XMLHttpRequest(); // a new request
    Httpreq.open('GET', 'https://ethgasstation.info/api/ethgasAPI.json?api-key=e5f795b727d73a876412a4b53bb18ba187af3e22b5030cd25758c1330b2e', false);
    Httpreq.send(null);
    var parsedGasData = JSON.parse(Httpreq.responseText);
    if (fastest) {
        return new bignumber_1.BigNumber(parsedGasData.fastest).shiftedBy(-10).toNumber(); //make sure this is right
    }
    else {
        return new bignumber_1.BigNumber(parsedGasData.average).shiftedBy(-10).toNumber();
    }
}
exports.gasPriceWei = gasPriceWei;
const hardcodedEstimates = {
    uniswapbalancer: 250000,
    uniswapuniswap: 200000,
    balancerbalancer: 300000
};
function estimate(awayEx, returnEx) {
    return new bignumber_1.BigNumber(hardcodedEstimates[`${awayEx}${returnEx}`]);
}
exports.estimate = estimate;
