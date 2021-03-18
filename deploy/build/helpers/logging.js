"use strict";
// import { BigNumber } from '@balancer-labs/sor/dist/utils/bignumber'
// import * as writer from 'csv-writer'
// import { Favorable2Exchange, Profitized } from '../types'
// //import { coinToDaiBatch } from './profitCalc'
// const { mainnet: addresses } = require('../addresses');
// const csvWriter = writer.createObjectCsvWriter({
//     path: '/home/ubuntu/EthDev/bot-contract/src/forever/opportunityLog.csv',
//     header: [
//         { id: 'block', title: 'Block #' },
//         { id: 'coin1', title: 'Outer Coin' },
//         { id: 'coin2', title: 'Inner Coin' },
//         { id: 'exchange1', title: '1st Exchange' },
//         { id: 'exchange2', title: '2nd Exchange' },
//         { id: 'initial', title: 'Start Amount' },
//         { id: 'diff2', title: 'Diff (Dai)' },
//         { id: 'totalGas', title: 'Total Gas Cost (Dai)' },
//         { id: 'profit', title: 'Profit (Dai)' }
//     ],
//     append: true
// })
// /**
//  * Logs opportunities to the console for debugging.
//  * @param opportunities list of favorable exchanges to log
//  * @returns void
//  */
// export async function logOpportunities(opportunities: Favorable2Exchange[]) {
//     console.log('=====================')
//     console.log('logging opportunities')
//     console.log('=====================')
//     if (opportunities.length === 0) {
//         console.log()
//         console.log('no opportunities')
//     }
//     const diffsInDai = await coinToDaiBatch(opportunities)
//     opportunities.forEach(({ coins, exchanges, inputAmount, middleAmount, outputAmount, difference, optimized }, i) => {
//         console.log()
//         console.log(`coin path: ${coins[0]} -> ${coins[1]} -> ${coins[0]}`)
//         console.log(`exchanges: ${exchanges[0]} -> ${exchanges[1]}`)
//         console.log(`initial amount: ${inputAmount.toString()}`)
//         console.log(`middle amount in ${coins[1]}: ${middleAmount.toString()}`)
//         console.log(`final amount: ${outputAmount.toFixed(addresses.tokens[coins[0]][1])}`)
//         console.log(`difference in ${coins[0]}: ${difference.toFixed(addresses.tokens[coins[0]][1])}`)
//         console.log(`difference in dai: ${diffsInDai[i].toFixed(addresses.tokens["dai"][1])}`)
//         console.log(`optimized: ${optimized}`)
//     })
// }
// /**
//  * Logs profit opportunities to the console for debugging.
//  * @param opportunities list of profitzed opportunities to log
//  * @returns void
//  */
// export async function logProfits(profitizedOpps: Profitized[]) {
//     console.log('=====================')
//     console.log('logging profitable opportunities')
//     console.log('=====================')
//     if (profitizedOpps.length === 0) {
//         console.log()
//         console.log('no opportunities')
//     }
//     profitizedOpps.forEach(({ coins, exchanges, inputAmount, middleAmount, outputAmount, difference, differenceInDai,
//         gasPriceDai, gasPriceWei, gasAmount, totalGasCost, profit, tx, optimized }) => {
//         console.log()
//         console.log(`coin path: ${coins[0]} -> ${coins[1]} -> ${coins[0]}`)
//         console.log(`exchanges: ${exchanges[0]} -> ${exchanges[1]}`)
//         console.log(`initial amount: ${inputAmount.toString()}`)
//         console.log(`middle amount in ${coins[1]}: ${middleAmount.toString()}`)
//         console.log(`final amount: ${outputAmount.toFixed(addresses.tokens[coins[0]][1])}`)
//         console.log(`difference in ${coins[0]}: ${difference.toFixed(addresses.tokens[coins[0]][1])}`)
//         console.log(`difference in dai: ${differenceInDai.toFixed(addresses.tokens["dai"][1])}`)
//         console.log(`gas price in dai: ${gasPriceDai.toFixed(addresses.tokens["dai"][1])}`)
//         console.log(`gas price in wei: ${gasPriceWei}`)
//         console.log(`gas amount in dai: ${gasAmount}`)
//         console.log(`total gas cost in dai: ${totalGasCost.toFixed(addresses.tokens["dai"][1])}`)
//         console.log(`profit in dai: ${profit.toFixed(addresses.tokens["dai"][1])}`)
//         console.log(`tx: ${tx}`)
//         console.log(`optimized: ${optimized}`)
//     })
// }
// /**
//  * Writes opportunities to a csv file if their arb discrepency in dai is above a certain threshold.
//  * @param minDai the threshold in dai
//  * @param block the block number for logging
//  * @returns void
//  */
// export async function writeOpportunities(opportunities: Profitized[], minDai: number, block: number) {
//     let records = opportunities.map((profitized, i) => {
//         return {
//             block: block,
//             coin1: profitized.coins[0],
//             coin2: profitized.coins[1],
//             exchange1: profitized.exchanges[0],
//             exchange2: profitized.exchanges[1],
//             initial: profitized.inputAmount.integerValue().toString(),
//             diff2: profitized.differenceInDai.integerValue().toString(),
//             totalGas: profitized.totalGasCost.toString(),
//             profit: profitized.profit.toString()
//         }
//     }).filter(rec => {
//         if (new BigNumber(rec.diff2).toNumber() > minDai) {
//             return true;
//         }
//         else {
//             return false
//         }
//     })
//     if (records.length > 0) {
//         csvWriter.writeRecords(records)
//     }
// }
