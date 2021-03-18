"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ethDevContract = exports.web3 = void 0;
const web3_1 = __importDefault(require("web3"));
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const abis = require('./abis');
const { mainnet: addresses } = require('./addresses');
console.log("starting");
exports.web3 = new web3_1.default(new web3_1.default.providers.WebsocketProvider(process.env.ALCHEMY_KOVAN_URL));
//Our wallet addresses
const { address: admin } = exports.web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
//Initialize the contract object
exports.ethDevContract = new exports.web3.eth.Contract(abis.flashloan.abi, //ABI JSON
"0x96CD8ed4d60D2c40a80b4d98BF09Cd8c4BaEB211");
var gwei = 1000000000;
var encodedParam = exports.web3.eth.abi.encodeParameter({
    "ArbInfoParameters": {
        "outerToken": 'address',
        "innerToken": 'address',
        "_awayOutput_0": 'uint256',
        "_awayOutput_1": 'uint256',
        "_returnOutput_0": 'uint256',
        "_returnOutput_1": 'uint256',
        "_awayInput": 'uint256',
        "_returnInput": 'uint256',
        "_awayExchange": 'uint8',
        "_returnExchange": 'uint8',
        "_awayPool": 'address',
        "_returnPool": 'address'
    }
}, {
    "outerToken": '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
    "innerToken": '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
    "_awayOutput_0": '0',
    "_awayOutput_1": '230972950932360380',
    "_returnOutput_0": '27763514452985919047',
    "_returnOutput_1": '0',
    "_awayInput": '16167862299584834545',
    "_returnInput": '230972950932360380',
    "_awayExchange": '2',
    "_returnExchange": '1',
    "_awayPool": '0x4BE9519d499d2EB02de9f25dd8e4e7aBd0a248Fc',
    "_returnPool": '0xB10cf58E08b94480fCb81d341A63295eBb2062C2'
});
var encodedParam2 = exports.web3.eth.abi.encodeParameter({
    "ArbInfoParameters": {
        "outerToken": 'address',
        "innerToken": 'address',
        "_awayOutput_0": 'uint256',
        "_awayOutput_1": 'uint256',
        "_returnOutput_0": 'uint256',
        "_returnOutput_1": 'uint256',
        "_awayInput": 'uint256',
        "_returnInput": 'uint256',
        "_awayExchange": 'uint8',
        "_returnExchange": 'uint8',
        "_awayPool": 'address',
        "_returnPool": 'address'
    }
}, {
    "outerToken": '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
    "innerToken": '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
    "_awayOutput_0": '0',
    "_awayOutput_1": '1002171769888540680',
    "_returnOutput_0": '106533662419737186948',
    "_returnOutput_1": '0',
    "_awayInput": '82531262278145971515',
    "_returnInput": '1002171769888540680',
    "_awayExchange": '2',
    "_returnExchange": '1',
    "_awayPool": '0x4BE9519d499d2EB02de9f25dd8e4e7aBd0a248Fc',
    "_returnPool": '0xB10cf58E08b94480fCb81d341A63295eBb2062C2'
});
console.log(encodedParam);
const init = async () => {
    const networkId = await exports.web3.eth.net.getId(); //GET MAINNET ID
    console.log("constructing");
    const tx = exports.ethDevContract.methods.initiateTrade(encodedParam2);
    //ESTIMATE THE GAS COST OF THE TRANSACTION (HOW MUCH GAS WE WILL USE, NOT THE PRICE OF THE GAS)
    const gasCost = 5000000;
    //HARDCODED GAS PRICE
    var gasPrice = gwei * 20;
    //ENCODE THE METHOD CALL USING THE ABI
    const data = tx.encodeABI();
    //CREATE TRANSACTION DATA
    const txData = {
        from: admin,
        to: "0x96CD8ed4d60D2c40a80b4d98BF09Cd8c4BaEB211",
        data,
        gas: gasCost,
        gasPrice //GAS PRICE WE WILL PAY
    };
    console.log("sending transactions");
    //SEND THE TRANSACTION TO THE NETWORK
    const receipt = await exports.web3.eth.sendTransaction(txData);
    console.log(receipt);
    console.log("Done");
};
init();
