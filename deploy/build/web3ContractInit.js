"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kovanProxies = exports.ethDevContract = exports.admin = exports.web3 = void 0;
const web3_1 = __importDefault(require("web3"));
const path = require('path');
const abis = require('./abis');
const { mainnet: addresses } = require('./addresses');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
//Initialize Web3 connection to our node
exports.web3 = new web3_1.default(new web3_1.default.providers.WebsocketProvider(process.env.ALCHEMY_KOVAN_URL));
//Our wallet address
exports.admin = exports.web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY).address;
//Initialize the ethDevContract
exports.ethDevContract = new exports.web3.eth.Contract(abis.optimalOpportunities.abi, //ABI JSON
'0xB24FA0a0B7Df136CC11ac0543d9f99BF6333d717');
exports.kovanProxies = exports.web3.eth.abi.encodeParameter({
    "Proxies": {
        "BalancerExchangeProxy": 'address',
        "BalancerRegistry": 'address',
        "UniswapFactory": 'address',
        "SushiswapFactory": 'address'
    }
}, {
    "BalancerExchangeProxy": '0x4e67bf5bD28Dd4b570FBAFe11D0633eCbA2754Ec',
    "BalancerRegistry": '0xC5570FC7C828A8400605e9843106aBD675006093',
    "UniswapFactory": '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    "SushiswapFactory": '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
});
