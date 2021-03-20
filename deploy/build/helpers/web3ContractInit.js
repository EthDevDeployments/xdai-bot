"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ethDevContract = exports.balancerRegistry = exports.balancerExchangeProxy = exports.sushiswapFactory = exports.uniswapFactory = exports.kyber = exports.web3 = void 0;
const web3_1 = __importDefault(require("web3"));
const abis = require('../abis');
const { mainnet: addresses } = require('../addresses');
//Initialize Web3 connection to our node
exports.web3 = new web3_1.default(new web3_1.default.providers.WebsocketProvider("ws://3.236.73.72:8546"));
//Our wallet address
const { address: admin } = exports.web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
//Create connection to kyber based on kyber network proxy
exports.kyber = new exports.web3.eth.Contract(abis.kyber.kyberNetworkProxy, addresses.contracts.kyberNetworkProxy);
//Create connection to uniswap factory 
exports.uniswapFactory = new exports.web3.eth.Contract(abis.uniswapFactory, addresses.contracts.uniswapFactory);
//Create connection to sushiswap factory 
exports.sushiswapFactory = new exports.web3.eth.Contract(abis.sushiswapFactory, addresses.contracts.sushiswapFactory);
//Create connection to balancer exchange proxy
exports.balancerExchangeProxy = new exports.web3.eth.Contract(abis.balancerExchangeProxy, addresses.contracts.balancerExchangeProxy);
//Create connection to balancer registry
exports.balancerRegistry = new exports.web3.eth.Contract(abis.balancerRegistry, addresses.contracts.balancerRegistry);
//Initialize the ethDevContract
exports.ethDevContract = new exports.web3.eth.Contract(abis.flashloan.abi, //ABI JSON
addresses.contracts.Flashloan);
