"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTransaction = exports.estimateGas = void 0;
const bignumber_1 = require("@balancer-labs/sor/dist/utils/bignumber");
const web3ContractInit_1 = require("../web3ContractInit");
const abis = require('../abis');
const { mainnet: addresses } = require('../addresses');
const { makeBatchRequest } = require('web3-batch-request');
async function estimateGas(opportunities, txList) {
    try {
        return Promise.all(opportunities.map((opportunity, i) => {
            const tx = web3ContractInit_1.ethDevContract.methods.initiateFlashLoan(addresses.contracts["dydx"], addresses.tokens[opportunity.coins[0]][0], addresses.tokens[opportunity.coins[1]][0], new bignumber_1.BigNumber(1).shiftedBy(addresses.tokens[opportunity.coins[0]][1]).toString(), 
            //opportunity.inputAmount.shiftedBy(addresses.tokens[opportunity.coins[0]][1]).toString(),
            addresses.contracts[opportunity.exchanges[0]], addresses.contracts[opportunity.exchanges[1]]);
            txList[i] = tx;
            return tx.estimateGas({ from: web3ContractInit_1.admin });
        }));
    }
    catch (error) {
        return 99999999999999;
    }
}
exports.estimateGas = estimateGas;
async function executeTransaction(best) {
    console.log("Found a transaction worth executing!!");
    console.log(best.tx);
    const data = best.tx.encodeABI();
    const txData = {
        from: web3ContractInit_1.admin,
        to: abis.flashloan.abi,
        data: data,
        gas: best.gasAmount,
        gasPrice: best.gasPriceWei.toString()
    };
    console.log("sending transactions");
    const receipt = await web3ContractInit_1.web3.eth.sendTransaction(txData);
    console.log("Done");
    console.log(receipt);
}
exports.executeTransaction = executeTransaction;
