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
const type = 'xdai';
// Initialize Web3 connection to our node
const web3 = new web3_1.default(new web3_1.default.providers.WebsocketProvider(process.env.NODE_XDAI_URL));
// Our wallet address
//const admin = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY as string)
const admin = (_a = process.env.WALLETS) === null || _a === void 0 ? void 0 : _a.split(', ').forEach((wallet) => {
    web3.eth.accounts.wallet.add(wallet);
});
// Initialize the our two contracts
const findOppContract = new web3.eth.Contract(abis.optimalOpportunities.abi, //ABI JSON
'0x43FF70FdF4420254242c1a1B7024e7cA174bAd62');
const execArbContract = new web3.eth.Contract(abis.flashloan.abi, //ABI JSON
'0xE62C48D175d40e14D85135C51688c05f459dC707');
// Initialize proxies reference
const proxies = addresses.contractsxDai;
// Decide standard coin
const stdCoin = 'wxdai';
// Decide on coins in coin list
const coins = ['weth', 'wxdai', 'hny', 'bao', 'stake', 'link', 'wbtc', 'uncx', 'xmoon', 'xgt', 'uni', 'yfi', 'badger', 'usdc', 'agve', 'baocx', 'rune', 'usdt'];
// Decide on outer coins
const outerCoins = ['wxdai', 'hny', 'weth'];
// Decide exchange list
const exchanges = ['BaoSwap', 'HoneySwap'];
// Initiialize coin address reference
const coinLookup = addresses.tokensxDai;
// Initiialize reverse coin address reference
const revCoinLookup = addresses.tokensReversexDai;
// Initiailize portion
const portion = 1111111111;
// Address ignore list
const ignoreAddresses = ['0x4958D7a5309740926C868d7EcA0d9DCCAC0BcB4A', '0x71199172Af06b51c7594Afb0ea9C2D2D3ef13eb8', '0xb1B4Bb486937b102E46777bD4ac1bc7B29019873', '0x5d9593586b4B5edBd23E7Eba8d88FD8F09D83EBd', '0x75Df5AF045d91108662D8080fD1FEFAd6aA0bb59', '0xFcEdfc956350E5585Cd58EfbCD7241E704AA5F1a', '0xA51156F3F1e39d1036Ca4ba4974107A1C1815d1e'].map((address) => address.toLowerCase());
// Additional helpers
function profitable(opportunity, gasPrice) {
    const totalGasCostWei = new bignumber_1.BigNumber(200000).multipliedBy(gasPrice);
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
    revCoinLookup: revCoinLookup,
    portion: portion,
    ignoreAddresses: ignoreAddresses,
    profitable: profitable,
    estimate: estimate,
    gasPriceWei: gasPriceWei,
    encodeExecutionInput: encodeExecutionInput,
    checkTransactionDetails: checkTransactionDetails,
    tracer: '',
};
