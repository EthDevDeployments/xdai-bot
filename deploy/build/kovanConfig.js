"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.chain = exports.estimate = void 0;
const bignumber_1 = require("@balancer-labs/sor/dist/utils/bignumber");
const web3_1 = __importDefault(require("web3"));
const path = require('path');
const abis = require('./abis');
const request = require('request-promise');
const { mainnet: addresses } = require('./addresses');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
//Type of chain
const type = 'kovan';
// Initialize Web3 connection to our node
const web3 = new web3_1.default(new web3_1.default.providers.WebsocketProvider(process.env.ALCHEMY_KOVAN_URL));
// Our wallet address
//const admin = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY as string)
const admin = (_a = process.env.WALLETS) === null || _a === void 0 ? void 0 : _a.split(', ').forEach((wallet) => {
    web3.eth.accounts.wallet.add(wallet);
});
// Initialize the our two contracts
const findOppContract = new web3.eth.Contract(abis.optimalOpportunities.abi, //ABI JSON
'0x1eafE79BEC35A4011146DcF151101BBBBd6Dbb15');
const execArbContract = new web3.eth.Contract(abis.flashloan.abi, //ABI JSON
'0x6B689858E304Aab7CDAb19A3F8d39C2943adD143');
// Initialize proxies reference
const proxies = addresses.contractsKovan;
// Decide standard coin
const stdCoin = 'weth';
// Decide on coins in coin list
const coins = ['weth', 'dai'];
// Decide on outer coins
const outerCoins = ['dai'];
// Decide exchange list
const exchanges = ['Balancer', 'Uniswap'];
// Initiialize coin address reference
const coinLookup = addresses.tokensKovan;
// Initiailize portion
const portion = 1111111111;
// Address ignore list
const ignoreAddresses = [''].map(address => address.toLowerCase());
// Additional helpers
function profitable(opportunity, gasPrice) {
    const totalGasCostWei = estimate(opportunity.awayExchange, opportunity.returnExchange).multipliedBy(gasPrice);
    const revenueInWei = new bignumber_1.BigNumber(opportunity.stdDiff);
    if (revenueInWei.isGreaterThan(totalGasCostWei)) {
        return true;
    }
    else {
        return false;
    }
}
function estimate(awayEx, returnEx) {
    return new bignumber_1.BigNumber(1000000);
}
exports.estimate = estimate;
function gasPriceWei(fastest) {
    return 1100000000;
}
function encodeExecutionInput(opportunity) {
    var _awayOutput_0, _awayOutput_1, _returnOutput_0, _returnOutput_1;
    opportunity.outerCoin.toLowerCase() < opportunity.innerCoin.toLowerCase() ? ((_awayOutput_0 = 0), (_awayOutput_1 = opportunity.innerWeiCoin), (_returnOutput_0 = opportunity.outputWeiCoin), (_returnOutput_1 = 0)) : ((_awayOutput_0 = opportunity.innerWeiCoin), (_awayOutput_1 = 0), (_returnOutput_0 = 0), (_returnOutput_1 = opportunity.outputWeiCoin));
    var _awayExchange = opportunity.awayExchange == 'uniswap' ? 1 : 2;
    var _returnExchange = opportunity.returnExchange == 'uniswap' ? 1 : 2;
    return web3.eth.abi.encodeParameter({
        ArbInfoParameters: {
            outerToken: 'address',
            innerToken: 'address',
            _awayOutput_0: 'uint256',
            _awayOutput_1: 'uint256',
            _returnOutput_0: 'uint256',
            _returnOutput_1: 'uint256',
            _awayInput: 'uint256',
            _returnInput: 'uint256',
            _awayExchange: 'uint8',
            _returnExchange: 'uint8',
            _awayPool: 'address',
            _returnPool: 'address',
        },
    }, {
        outerToken: opportunity.outerCoin,
        innerToken: opportunity.innerCoin,
        _awayOutput_0: _awayOutput_0,
        _awayOutput_1: _awayOutput_1,
        _returnOutput_0: _returnOutput_0,
        _returnOutput_1: _returnOutput_1,
        _awayInput: opportunity.inputWeiCoin,
        _returnInput: opportunity.innerWeiCoin,
        _awayExchange: _awayExchange,
        _returnExchange: _returnExchange,
        _awayPool: opportunity.awayPool,
        _returnPool: opportunity.returnPool,
    });
}
async function checkTransactionDetails(transactionObject) {
    console.log('sending request');
    const options = {
        url: process.env.NODE_URL_RPC,
        method: 'post',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'debug_traceCall', params: [transactionObject, 'pending', { disableMemory: true, disableStorage: true, tracer: exports.chain.tracer }] }),
    };
    const response = await request(options);
    const responseJSON = JSON.parse(response);
    if (responseJSON.result === null) {
        console.log('error' + response);
        return;
    }
    return responseJSON.result.structLogs;
}
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
exports.chain = {
    type: type,
    web3: web3,
    admin: admin,
    findOppContract: findOppContract,
    execArbContract: execArbContract,
    proxies: proxies,
    stdCoin: stdCoin,
    coins: coins,
    outerCoins: outerCoins,
    exchanges: exchanges,
    coinLookup: coinLookup,
    portion: portion,
    ignoreAddresses: ignoreAddresses,
    profitable: profitable,
    estimate: estimate,
    gasPriceWei: gasPriceWei,
    encodeExecutionInput: encodeExecutionInput,
    checkTransactionDetails: checkTransactionDetails,
    tracer: tracer,
};
