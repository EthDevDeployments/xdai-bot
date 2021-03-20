"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.web3 = void 0;
const request = require('request-promise');
const web3_1 = __importDefault(require("web3"));
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const abis = require('./abis');
const { mainnet: addresses } = require('./addresses');
const abiDecoder = require('abi-decoder'); // NodeJS
exports.web3 = new web3_1.default(new web3_1.default.providers.WebsocketProvider(process.env.NODE_URL));
const UniV2RouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const SushiV2RouterAddress = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F';
const BalancerExchangeAddress = '0x3E66B66Fd1d0b02fDa6C811Da9E0547970DB2f21';
const uniV2ABI = abis.uniswapRouter;
const balancerABI = abis.balancerExchangeProxy;
abiDecoder.addABI(uniV2ABI);
abiDecoder.addABI(uniV2ABI);
//export const web3_http = new Web3(new Web3.providers.HttpProvider(process.env.NODE_URL_RPC as string));
//const tracer = "{logs: [],extractStack: function (stack, op) {var extract = [];for (var i = 0; i < stack.length(); i++) {extract.push(stack.peek(i));}return extract;},step: function (log, db) {this.logs.push({op: log.op.toString(),stack: this.extractStack(log.stack),depth: log.depth,error: log.err});},fault: function() {},result: function () {return {structLogs: this.logs};}}"
//var contract_Decoded = new TextDecoder("hex").decode(contract);
const tracer = `
{
    logs: {},
    extractStack: function (stack, op) {
        var extract = [];
        for (var i = 0; i < stack.length(); i++) {
            extract.push(stack.peek(i));
        }
        return extract;
    },
    step: function (log, db) {
        var convertToString = function(byteArray){
            string_decoded = ''
            for (var i=0; i<byteArray.byteLength; i++) {
                if (byteArray[i] < 16) string_decoded += '0';
                string_decoded += byteArray[i].toString(16);
            }
            return string_decoded;
        }

        var contract = log.contract.getAddress();
        var input = log.contract.getInput();
        var contract_Decoded = '0x' + convertToString(contract);
        var input_decoded = '0x' + convertToString(input);
        this.logs[contract_Decoded] = input_decoded;
    },
    fault: function() {},
    result: function () {
        return {structLogs: this.logs};
    }
 }`;
async function checkTransactionDetails(transactionObject) {
    console.log('sending request');
    let options = {
        url: process.env.NODE_URL_RPC,
        method: 'post',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'debug_traceCall', params: [transactionObject, 'pending', { disableMemory: true, disableStorage: true, tracer: tracer }] }),
    };
    let response = await request(options);
    let responseJSON = JSON.parse(response);
    if (responseJSON.result == null) {
        console.log('error' + response);
        return;
    }
    return responseJSON.result.structLogs;
}
var count = 0;
const init = async () => {
    exports.web3.eth
        .subscribe('pendingTransactions', function (error, result) {
        if (error)
            console.log(error);
    })
        .on('data', async function (transaction) {
        let data = await exports.web3.eth.getTransaction(transaction); //Get transaction information
        if (data == null || data.to == null)
            return; //Check if transaction is valid
        let contractCode = await exports.web3.eth.getCode(data.to); //Get contract code
        if (contractCode == '0x')
            return; //Return if transaction is not a contract
        if (Number(data.gasPrice) > 200000000000) {
            count = count + 1;
            //This only outputs the first contract interaction TODO: get duplicate contract interaction as well (because of the way the map is set up)
            var executionData = await checkTransactionDetails({ from: data.from, to: data.to, gas: web3_1.default.utils.toHex(data.gas), gasPrice: web3_1.default.utils.toHex(data.gasPrice), value: web3_1.default.utils.toHex(data.value), data: data.input });
            console.log(transaction);
            for (var key in executionData) {
                //Key is key. add it to a dict with gas as the value
                if (key.toLowerCase() == UniV2RouterAddress.toLowerCase() || key.toLowerCase() == SushiV2RouterAddress.toLowerCase() || key.toLowerCase() == BalancerExchangeAddress.toLowerCase()) {
                    console.log('ROUTER TRANSACTION');
                    console.log(transaction);
                    let decoded = abiDecoder.decodeMethod(executionData[key]);
                    console.log('decoded:');
                    console.log(decoded.name);
                    let decodedParams = decoded.params;
                    for (let i = 0; i < decodedParams.length; i++) {
                        console.log(decodedParams[i]);
                    }
                }
                else {
                    console.log('NONE: ' + key);
                }
            }
        }
    });
};
init();
