"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_mutex_1 = require("async-mutex");
const bignumber_1 = require("@balancer-labs/sor/dist/utils/bignumber");
// TODO: Pending transactions are handles incorrectly... all txs are pending until the block updates
function createPGAManager(updateThresholdOnBid, getFirstBidAmount, chain, walletKey, walletAddress, walletIndex) {
    const cancellationMarkup = 1.2;
    const rebidMarkup = 1.15;
    const rebidIncrement = 100000;
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
                loggingString = `#[${newBlockNumber}] W: ${walletIndex}`;
                if (!isCancelling && currentOpportunity === null) {
                    lastGasBid = 0;
                    blocksSeenWhileStuck = 0;
                    setIsBusy(false);
                }
                else {
                    blocksSeenWhileStuck++;
                    blocksSeenWhileStuck > 0
                        ? logEvent(`Stuck for ${blocksSeenWhileStuck} blocks`)
                        : null;
                    if (blocksSeenWhileStuck > 2) {
                        logEvent('CANCELLING Manager Stuck');
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
                if ((currentOpportunity.awayPool.toLowerCase() === key &&
                    gas >= lastGasBid) ||
                    (currentOpportunity.returnPool.toLowerCase() === key &&
                        gas >= lastGasBid)) {
                    // Rebid if still profitable. Cancel the tx if not
                    logEvent(`COMPETITION ${transaction} Gas Price: ${gas}`);
                    const rev = Number(new bignumber_1.BigNumber(currentOpportunity.stdDiff)) / Math.pow(10, 18);
                    const gasPriceA = Number(new bignumber_1.BigNumber(lastGasBid).multipliedBy(rebidMarkup).toFixed(0));
                    const gasPriceB = gas + rebidIncrement;
                    const newGasBid = gasPriceA > gasPriceB ? gasPriceA : gasPriceB;
                    if (chain.profitable(currentOpportunity, newGasBid)) {
                        console.time(`${loggingString} BID Rev: $${rev} Gas Price: ${newGasBid} ${chain.revCoinLookup[currentOpportunity.outerCoin]}-->${chain.revCoinLookup[currentOpportunity.innerCoin]}`);
                        bidOnOpportunity(currentOpportunity, newGasBid, false);
                        console.timeEnd(`${loggingString} BID Rev: $${rev} Gas Price: ${newGasBid} ${chain.revCoinLookup[currentOpportunity.outerCoin]}-->${chain.revCoinLookup[currentOpportunity.innerCoin]}`);
                    }
                    else {
                        logEvent('CANCELLING No Longer Profitable');
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
            const rev = Number(new bignumber_1.BigNumber(opportunity.stdDiff)) / Math.pow(10, 18);
            // Check to see if we are profitable after paying for gas
            if (chain.profitable(opportunity, gasPriceBid)) {
                // Make first bid
                console.log(`${loggingString} FIRST BID Rev: $${rev} Gas Price: ${gasPriceBid} ${chain.revCoinLookup[opportunity.outerCoin]}-->${chain.revCoinLookup[opportunity.innerCoin]}`);
                bidOnOpportunity(opportunity, gasPriceBid, true);
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
            receipt.status
                ? logEvent(`CANCELLED with gas Price of: ${newGasBid}`)
                : logEvent(`CANCELLED with gas Price of: ${newGasBid} FAILED`);
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
        const gasAmount = chain
            .estimate(opportunity.awayExchange, opportunity.returnExchange)
            .toNumber();
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
            receipt.status
                ? logEvent(`SUCCEEDED with revenue: $${new bignumber_1.BigNumber(opportunity.stdDiff).toNumber() / Math.pow(10, 18)} and gas Price of: ${gasPrice} (Get fucked)`)
                : logEvent(`FAILED with revenue: $${new bignumber_1.BigNumber(opportunity.stdDiff).toNumber() / Math.pow(10, 18)} and gas Price of: ${gasPrice} `);
            currentOpportunity = null;
        })
            .catch((err) => {
            if (!err.message.includes('50 blocks')) {
                if (!err.message.includes('funds')) {
                    console.log('ERROR: Bid Didnt Make it in Time');
                }
                else {
                    console.log(err);
                }
            }
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
        const _hour = date.getHours();
        const hour = _hour > 5 ? _hour - 5 : 19 + _hour;
        return `${hour}:${minutes.length > 1 ? minutes : '0' + minutes}:${seconds.length > 1 ? seconds : '0' + seconds}:${ms.length > 1 ? ms : '0' + ms}`;
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
