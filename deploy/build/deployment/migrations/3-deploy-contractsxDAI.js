"use strict";
const Flashloan_xDAI = artifacts.require("../contracts/Execution/Flashloan_xDAI.sol");
const Optimizers = artifacts.require("../contracts/Opportunity/Optimizers.sol");
const Uniswap = artifacts.require("../contracts/Opportunity/Uniswap.sol");
const Balancer = artifacts.require("../contracts/Opportunity/Balancer.sol");
const optimalOpportunities = artifacts.require("../contracts/Opportunity/optimalOpportunities.sol");
const { mainnet: addresses } = require('../../addresses'); //Not sure why this shows as an error, this is the correct path
module.exports = function (deployer, _network, [beneficiaryAddress, _]) {
    deployer.deploy(Optimizers);
    deployer.link(Optimizers, optimalOpportunities);
    deployer.deploy(Uniswap);
    deployer.deploy(Balancer);
    deployer.link(Uniswap, optimalOpportunities);
    deployer.link(Balancer, optimalOpportunities);
    deployer.deploy(optimalOpportunities, '0xA818b4F111Ccac7AA31D0BCc0806d64F2E0737D7');
    deployer.deploy(Flashloan_xDAI);
};
