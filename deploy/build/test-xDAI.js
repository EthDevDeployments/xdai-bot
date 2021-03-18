"use strict";
// import createMempoolManager from './helpers/mempoolManager'
// import createOpportunityManager from './helpers/opportunityManager'
// import { chain } from './xDaiConfig'
const path = require('path');
// require('dotenv').config({ path: path.resolve(process.env.ENVPATH) })
console.log(process.env.ENVPATH);
console.log('starting');
// const init = async () => {
// 	let blockNumber = 0
// 	const { shouldIgnoreNextBlock, updateMempoolBlock, pgaManagers, parseTransaction } = createMempoolManager(chain)
// 	chain.web3.eth.subscribe('pendingTransactions').on('data', async function (transaction) {
// 		parseTransaction(transaction)
// 	})
// 	const { createOpportunityBatchList, executeLoadedBatch, opportunityParams } = createOpportunityManager(pgaManagers, shouldIgnoreNextBlock, chain)
// 	await createOpportunityBatchList()
// 	console.log(opportunityParams.pairs)
// 	chain.web3.eth.subscribe('newBlockHeaders').on('data', async (block) => {
// 		//console.log(`Block Number ${block.number}`)
// 		if (block.number > blockNumber) {
// 			blockNumber = block.number
// 			await updateMempoolBlock(blockNumber)
// 		}
// 		executeLoadedBatch()
// 	})
// }
// init()
