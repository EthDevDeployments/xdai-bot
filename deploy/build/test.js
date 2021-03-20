"use strict";
// import { logOpportunities, logProfits, writeOpportunities } from './helpers/logging';
// import { web3 } from './web3ContractInit'
// import { getProfit, pickBest } from './helpers/profitCalc';
// const { makeBatchRequest } = require('web3-batch-request');
// const init = async () => {
//     const networkId = await web3.eth.net.getId()
//     // Subscribe to new eth block headers
//     web3.eth.subscribe('newBlockHeaders')
//         .on('data', async block => {
//             console.log()
//             console.log(`New block received. Block  # ${block.number}`)
//             //Look for opportunities
//             const showAll = false
//             const coinArray = ['weth', 'dai', 'usdc', 'wbtc', 'uni', 'ampl', 'susd', 'meme', 'yfii', 'yfi']
//             const exchangeArray = ['kyber', 'balancer', 'uniswap', 'sushiswap']
//             console.time(`Opportunities (block # ${block.number})`)
//             //const opportunities = await gatherOpportunities(exchangeArray, coinArray, 10, showAll)
//             console.timeEnd(`Opportunities (block # ${block.number})`)
//             console.time(`Optimization (block # ${block.number})`)
//             //const optimizedOpportunities = await optimize(opportunities, null, 1.5, false)
//             console.timeEnd(`Optimization (block # ${block.number})`)
//             console.time(`Profit (block # ${block.number})`)
//             //const profitizedOpportunities = await getProfit(optimizedOpportunities)
//             console.timeEnd(`Profit (block # ${block.number})`)
//             console.time(`Writing to Csv (block # ${block.number})`)
//             //writeOpportunities(profitizedOpportunities, 0, block.number)
//             console.timeEnd(`Writing to Csv (block # ${block.number})`)
//             //logProfits(profitizedOpportunities)
//         }).on('error', error => {
//             console.log(error)
//         })
// }
// init()
