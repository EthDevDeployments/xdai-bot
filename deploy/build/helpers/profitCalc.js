"use strict";
// import { BigNumber } from "@balancer-labs/sor/dist/utils/bignumber"
// import { Token, ChainId, Route, Trade, TokenAmount, TradeType, Pair } from "@uniswap/sdk"
// import { XMLHttpRequest } from "xmlhttprequest"
// import { BatchCall, BigNum, Favorable2Exchange, Profitized } from "../types"
// import { web3 } from "../web3ContractInit"
// import { estimateGas } from "./transactions"
// const abis = require('../abis')
// const { mainnet: addresses } = require('../addresses')
// const { makeBatchRequest } = require('web3-batch-request')
// export function pickBest(profitizedOpps: Profitized[]): Profitized | null {
//   var best: Profitized | null = null
//   profitizedOpps.filter(opportunity => opportunity.profit.isGreaterThan(0)).forEach(profitableOpportunity => {
//     if (best == null || profitableOpportunity.profit.isGreaterThan(best.profit)) {
//       best = profitableOpportunity
//     }
//   })
//   return best
// }
// export async function getProfit(opportunities: Favorable2Exchange[]) {
//   var txList = opportunities.map(opportunity => null)
//   const gasPrice = gasPriceWei(true)
//   const gasAmounts = await estimateGas(opportunities, txList)
//   const gasPriceDai = await coinToDai("weth", gasPrice)
//   const differences = await coinToDaiBatch(opportunities)
//   return opportunities.map((opportunity, i) => {
//     return {
//       coins: opportunity.coins,
//       exchanges: opportunity.exchanges,
//       inputAmount: opportunity.inputAmount,
//       middleAmount: opportunity.middleAmount,
//       outputAmount: opportunity.outputAmount,
//       difference: opportunity.difference,
//       differenceInDai: differences[i],
//       gasPriceDai: gasPriceDai,
//       gasPriceWei: gasPrice.shiftedBy(18),
//       gasAmount: gasAmounts[i],
//       totalGasCost: gasPriceDai.multipliedBy(gasAmounts[i]),
//       profit: differences[i].minus(gasPriceDai.multipliedBy(gasAmounts[i])),
//       tx: txList[i],
//       optimized: opportunity.optimized
//     }
//   }
//   )
// }
// export function gasPriceWei(fastest: boolean) {
//   var Httpreq = new XMLHttpRequest(); // a new request
//   Httpreq.open("GET", "https://ethgasstation.info/api/ethgasAPI.json?api-key=e5f795b727d73a876412a4b53bb18ba187af3e22b5030cd25758c1330b2e", false);
//   Httpreq.send(null)
//   var parsedGasData = JSON.parse(Httpreq.responseText);
//   if (fastest) {
//     return new BigNumber(parsedGasData.fastest).shiftedBy(-10)//make sure this is right
//   }
//   else {
//     return new BigNumber(parsedGasData.average).shiftedBy(-10)
//   }
// }
// export async function coinToDai(coin: string, inputAmount: BigNum) {
//   const srcToken = addresses.tokens["dai"]
//   const destToken = addresses.tokens[coin]
//   const tokenA = new Token(ChainId.MAINNET, srcToken[0], srcToken[1])
//   const tokenB = new Token(ChainId.MAINNET, destToken[0], destToken[1])
//   if (coin == "dai") {
//     return inputAmount
//   }
//   try {
//     const pairAddress = await uniswapFactory.methods.getPair(srcToken[0], destToken[0]).call()
//     const uniswapPairs = new web3.eth.Contract(
//       abis.uniswapPairs,
//       pairAddress
//     )
//     const reserves = await uniswapPairs.methods.getReserves().call()
//     const reserve0 = reserves._reserve0
//     const reserve1 = reserves._reserve1
//     const tokens = [tokenA, tokenB]
//     const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]]
//     const pair = new Pair(new TokenAmount(token0, reserve0), new TokenAmount(token1, reserve1))
//     const route = new Route([pair], tokenA)
//     const input = new BigNumber(1).shiftedBy(srcToken[1])
//     const trade = new Trade(route, new TokenAmount(tokenA, input.toString(10)), TradeType.EXACT_INPUT)
//     const rate = new BigNumber(trade.executionPrice.toSignificant(destToken[1]))
//     return inputAmount.dividedBy(rate)
//   }
//   catch (coinDoesntExist) {
//     return new BigNumber(0)
//   }
// }
// export async function coinToDaiBatch(opportunities: Favorable2Exchange[]) {
//   var entries = opportunities.map(() => { return { output: new BigNumber(0) } })
//   var calls: BatchCall[] = []
//   var secondaryCalls: BatchCall[] = []
//   opportunities.forEach((FE, i) => {
//     if (FE.coins[0] == 'dai') {
//       entries[i] = { output: FE.difference }
//     }
//     else {
//       const srcToken = addresses.tokens['dai']
//       const destToken = addresses.tokens[FE.coins[0]]
//       const tokenA = new Token(ChainId.MAINNET, srcToken[0], srcToken[1])
//       const tokenB = new Token(ChainId.MAINNET, destToken[0], destToken[1])
//       const call = {
//         ethCall: uniswapFactory.methods.getPair(srcToken[0], destToken[0]).call,
//         onSuccess: pairAddress => {
//           const uniswapPairs = new web3.eth.Contract(
//             abis.uniswapPairs,
//             pairAddress
//           )
//           const secondaryCall = {
//             ethCall: uniswapPairs.methods.getReserves().call,
//             onSuccess: reserves => {
//               const reserve0 = reserves._reserve0
//               const reserve1 = reserves._reserve1
//               const tokens = [tokenA, tokenB]
//               const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]]
//               const pair = new Pair(new TokenAmount(token0, reserve0), new TokenAmount(token1, reserve1))
//               const route = new Route([pair], tokenA)
//               const input = new BigNumber(1).shiftedBy(srcToken[1])
//               const trade = new Trade(route, new TokenAmount(tokenA, input.toString(10)), TradeType.EXACT_INPUT)
//               const rate = new BigNumber(trade.executionPrice.toSignificant(destToken[1]))
//               const output = FE.difference.dividedBy(rate)
//               entries[i] = { output }
//             }
//           }
//           secondaryCalls.push(secondaryCall)
//         }
//       }
//       calls.push(call)
//     }
//   })
//   try {
//     await makeBatchRequest(web3, calls)
//     if (secondaryCalls.length > 0) {
//       await makeBatchRequest(web3, secondaryCalls)
//     }
//   }
//   catch (error) { }
//   return entries.map(entry => {
//     return entry.output
//   })
// }
