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
exports.web3 = new web3_1.default(new web3_1.default.providers.WebsocketProvider(process.env.NODE_XDAI_URL));
async function checkTransactionDetails(transactionObject) {
    //console.log('sending request')
    let options = {
        url: process.env.NODE_XDAI_RPC_URL,
        method: 'post',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'trace_rawTransaction', params: [transactionObject, ['trace']] }),
    };
    let response = await request(options);
    let responseJSON = JSON.parse(response);
    if (responseJSON.result == null) {
        console.log('error' + response);
        return;
    }
    return responseJSON.result.trace;
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
        var executionData = await checkTransactionDetails(data['raw']);
        console.log('TX:' + transaction);
        for (var key in executionData) {
            console.log(executionData[key]['action']['to']);
            //console.log(obj['action']['to'])
        }
        //console.log(data['raw']);
    });
};
init();
