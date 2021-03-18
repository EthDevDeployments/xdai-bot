"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_mutex_1 = require("async-mutex");
const bignumber_1 = require("@balancer-labs/sor/dist/utils/bignumber");
// TODO: Pending transactions are handles incorrectly... all txs are pending until the block updates
function createPGAManager(updateThresholdOnBid, getFirstBidAmount, chain, walletKey, walletAddress, walletIndex) {
    const cancellationMarkup = 1.2;
    const rebidMarkup = 1.15;
    const baseBidAmount = 1000000000;
    let blockNumber = 0;
    let blocksSeenWhileStuck = 0;
    let busy = false;
    let nonce = 0;
    let lastGasBid = 0;
    let currentOpportunity = null;
    let isCancelling = false;
    let loggingString = '';
    let lowestBiddingTx;
    const mutex = new async_mutex_1.Mutex();
    async function updateBlock(newBlockNumber) {
        await mutex.runExclusive(async () => {
            // Clear all data structures and cancel any pending txs on new block
            if (newBlockNumber > blockNumber) {
                blockNumber = newBlockNumber;
                loggingString = `Block#[${newBlockNumber}] Wallet Id: ${walletIndex}`;
                if (!isCancelling && currentOpportunity === null) {
                    lastGasBid = 0;
                    blocksSeenWhileStuck = 0;
                    setIsBusy(false);
                }
                else {
                    blocksSeenWhileStuck++;
                    blocksSeenWhileStuck > 0 ? logEvent(`Stuck for ${blocksSeenWhileStuck} blocks`) : null;
                    if (blocksSeenWhileStuck > 2) {
                        logEvent('Manager stuck so were cancelling');
                        cancelTx();
                        blocksSeenWhileStuck = 0;
                    }
                }
            }
        });
    }
    async function evaluatePendingTx(key, gas, transaction) {
        // See if the insertion requires a rebid
        await mutex.runExclusive(async () => {
            if (currentOpportunity != null) {
                if ((currentOpportunity.awayPool.toLowerCase() === key && gas >= lastGasBid) || (currentOpportunity.returnPool.toLowerCase() === key && gas >= lastGasBid)) {
                    // Rebid if still profitable. Cancel the tx if not
                    logEvent(`We found a competitive bid competition on transaction: ${transaction} With gas price: ${gas}`);
                    const newGasBid = Number(new bignumber_1.BigNumber(gas).multipliedBy(rebidMarkup).toFixed(0));
                    if (chain.profitable(currentOpportunity, newGasBid)) {
                        console.time(`${loggingString} RE-BID with revenue of: $${new bignumber_1.BigNumber(currentOpportunity.stdDiff).toNumber() / Math.pow(10, 18)} and gas Price of: ${newGasBid}`);
                        bidOnOpportunity(currentOpportunity, newGasBid, false);
                        console.timeEnd(`${loggingString} RE-BID with revenue of: $${new bignumber_1.BigNumber(currentOpportunity.stdDiff).toNumber() / Math.pow(10, 18)} and gas Price of: ${newGasBid}`);
                    }
                    else {
                        logEvent('No longer profitable so were cancelling');
                        cancelTx();
                    }
                }
            }
        });
    }
    async function evaluateOpportunity(opportunity) {
        await mutex.runExclusive(async () => {
            // Update nonce
            nonce = await chain.web3.eth.getTransactionCount(walletAddress);
            // We have a revenue generating opportunity
            const gasPriceBid = getFirstBidAmount(baseBidAmount, opportunity);
            // Check to see if we are profitable after paying for gas
            if (chain.profitable(opportunity, gasPriceBid)) {
                // Make first bid
                console.time(`${loggingString} FIRST-BID with revenue of: $${new bignumber_1.BigNumber(opportunity.stdDiff).toNumber() / Math.pow(10, 18)} and gas Price of: ${gasPriceBid}`);
                bidOnOpportunity(opportunity, gasPriceBid, true);
                console.timeEnd(`${loggingString} FIRST-BID with revenue of: $${new bignumber_1.BigNumber(opportunity.stdDiff).toNumber() / Math.pow(10, 18)} and gas Price of: ${gasPriceBid}`);
            }
        });
    }
    function cancelTx() {
        // Create transaction data
        const newGasBid = Number(new bignumber_1.BigNumber(lastGasBid).multipliedBy(cancellationMarkup).toFixed(0));
        chain.web3.eth
            .sendTransaction({
            from: walletKey,
            to: '0x0000000000000000000000000000000000000000',
            value: 0,
            gas: 21000,
            gasPrice: newGasBid,
            nonce: nonce,
        })
            .then((receipt) => {
            receipt.status ? logEvent(`CANCELLED with gas Price of: ${newGasBid} SUCCEEDED`) : logEvent(`CANCELLED with gas Price of: ${newGasBid} FAILED`);
            isCancelling = false;
        })
            .catch((err) => {
            isCancelling = false;
        });
        // We no longer have a current opportunity that we're watching
        currentOpportunity = null;
        isCancelling = true;
        lastGasBid = newGasBid;
    }
    function bidOnOpportunity(opportunity, gasPrice, isFirst) {
        const encodedInput = chain.encodeExecutionInput(opportunity);
        const tx = chain.execArbContract.methods.initiateTrade(encodedInput);
        const gasAmount = chain.estimate(opportunity.awayExchange, opportunity.returnExchange).toNumber();
        const data = tx.encodeABI();
        if (isFirst) {
            // Update current opportunity and last gas bid
            currentOpportunity = opportunity;
        }
        lastGasBid = gasPrice;
        // Create transaction data
        const txData = {
            from: walletKey,
            to: chain.execArbContract.options.address,
            data,
            gas: gasAmount,
            gasPrice,
            nonce: nonce,
        };
        // Execute the tx
        chain.web3.eth
            .sendTransaction(txData)
            .then((receipt) => {
            receipt.status ? logEvent(`SUCCEEDED with revenue: $${new bignumber_1.BigNumber(opportunity.stdDiff).toNumber() / Math.pow(10, 18)} and gas Price of: ${gasPrice} (Get fucked)`) : logEvent(`FAILED with revenue: $${new bignumber_1.BigNumber(opportunity.stdDiff).toNumber() / Math.pow(10, 18)} and gas Price of: ${gasPrice} `);
            currentOpportunity = null;
        })
            .catch((err) => {
            !err.message.includes('50 blocks') ? logEvent(`Caught error while bidding: ${err}`) : null;
            currentOpportunity = null;
        });
        // We may need to update the threshold gas price
        // if (lowestBiddingTx.nonce === submittedTx.nonce) {
        // 	// We need to find the new lowest bid since we just rebid on the previous lowest bidding tx
        // 	let newLowestBiddingTx = lowestBiddingTx
        // 	PGAParams.submittedTxs.forEach((tx) => {
        // 		if (tx.gasPrice < newLowestBiddingTx.gasPrice) newLowestBiddingTx = tx
        // 	})
        // 	lowestBiddingTx = newLowestBiddingTx
        // 	// Now update the threshold in mempool manager
        // 	updateThresholdOnBid(lowestBiddingTx.gasPrice)
        // }
    }
    function getCurrentOpportunityPools() {
        if (currentOpportunity !== null) {
            return [currentOpportunity.awayPool, currentOpportunity.returnPool];
        }
        else {
            return ['a', 'a'];
        }
    }
    function logEvent(string) {
        console.log(`${loggingString} ${string} TIME: ${timestamp()}`);
    }
    function setIsBusy(newBusyState) {
        busy = newBusyState;
    }
    function getIsBusy() {
        return busy;
    }
    function timestamp() {
        // (month - day - year)
        const date = new Date();
        const minutes = date.getMinutes().toString();
        const seconds = date.getSeconds().toString();
        const ms = date.getMilliseconds().toString();
        return `${(date.getHours() - 5) % 24}:${minutes.length > 1 ? minutes : '0' + minutes}:${seconds.length > 1 ? seconds : '0' + seconds}:${ms.length > 1 ? ms : '0' + ms}`;
    }
    return {
        getCurrentOpportunityPools,
        updateBlock,
        evaluatePendingTx,
        evaluateOpportunity,
        getIsBusy,
        setIsBusy,
    };
}
exports.default = createPGAManager;
