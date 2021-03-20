"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tracer = exports.encodeExecutionInput = exports.proxies = exports.execArbContract = exports.findOppContract = exports.admin = exports.web3 = void 0;
const web3_1 = __importDefault(require("web3"));
const path = require('path');
const abis = require('./abis');
const { mainnet: addresses } = require('./addresses');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
// Initialize Web3 connection to our node
exports.web3 = new web3_1.default(new web3_1.default.providers.WebsocketProvider(process.env.ALCHEMY_KOVAN_URL));
// Our wallet address
exports.admin = exports.web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY).address;
// Initialize the our two contracts
exports.findOppContract = new exports.web3.eth.Contract(abis.optimalOpportunities.abi, //ABI JSON
'0x9454d64FD4a7a0F4D5e85cdfb3B91AE4826cee34');
exports.execArbContract = new exports.web3.eth.Contract(abis.flashloan.abi, //ABI JSON
'0xf7f19B375c7bD34160CA2D14AdEAbe57BEB05580');
// Initialize proxies
exports.proxies = {
    Uniswap: {
        Proxy: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
        Type: 'uniswap',
    },
    Balancer: {
        Proxy: '0xC5570FC7C828A8400605e9843106aBD675006093',
        Type: 'balancer',
    },
    SushiSwap: {
        Proxy: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        Type: 'uniswap',
    },
};
// Additional helpers
function encodeExecutionInput(opportunity) {
    var _awayOutput_0, _awayOutput_1, _returnOutput_0, _returnOutput_1;
    opportunity.outerCoin.toLowerCase() < opportunity.innerCoin.toLowerCase() ? ((_awayOutput_0 = 0), (_awayOutput_1 = opportunity.innerWeiCoin), (_returnOutput_0 = opportunity.outputWeiCoin), (_returnOutput_1 = 0)) : ((_awayOutput_0 = opportunity.innerWeiCoin), (_awayOutput_1 = 0), (_returnOutput_0 = 0), (_returnOutput_1 = opportunity.outputWeiCoin));
    var _awayExchange = opportunity.awayExchange == 'uniswap' ? 1 : 2;
    var _returnExchange = opportunity.returnExchange == 'uniswap' ? 1 : 2;
    return exports.web3.eth.abi.encodeParameter({
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
exports.encodeExecutionInput = encodeExecutionInput;
exports.tracer = `
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
