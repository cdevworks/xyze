var fs = require('fs')

// ============ Contracts ============


// Protocol
// deployed second
const KRAPImplementation = artifacts.require("KRAPDelegate");
const KRAPProxy = artifacts.require("KRAPDelegator");

// deployed third
const KRAPReserves = artifacts.require("KRAPReserves");
const KRAPRebaser = artifacts.require("KRAPRebaser");

const Gov = artifacts.require("GovernorAlpha");
const Timelock = artifacts.require("Timelock");

// deployed fourth
const KRAP_ETHPool = artifacts.require("KRAPETHPool");
const KRAP_uAMPLPool = artifacts.require("KRAPAMPLPool");
const KRAP_YFIPool = artifacts.require("KRAPYFIPool");
const KRAP_LINKPool = artifacts.require("KRAPLINKPool");
const KRAP_MKRPool = artifacts.require("KRAPMKRPool");
const KRAP_LENDPool = artifacts.require("KRAPLENDPool");
const KRAP_COMPPool = artifacts.require("KRAPCOMPPool");
const KRAP_SNXPool = artifacts.require("KRAPSNXPool");
const KRAP_YFIIPool = artifacts.require("KRAPYFIIPool");
const KRAP_KNCPool = artifacts.require("KRAPKNCPool");


// deployed fifth
const KRAPIncentivizer = artifacts.require("KRAPIncentivizer");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    // deployTestContracts(deployer, network),
    deployDistribution(deployer, network, accounts),
    // deploySecondLayer(deployer, network)
  ]);
}

module.exports = migration;

// ============ Deploy Functions ============


async function deployDistribution(deployer, network, accounts) {
  console.log(network)
  let krap = await KRAPProxy.deployed();
  let yReserves = await KRAPReserves.deployed()
  let yRebaser = await KRAPRebaser.deployed()
  let tl = await Timelock.deployed();
  let gov = await Gov.deployed();
  if (network != "test") {

    let eth_pool = new web3.eth.Contract(KRAP_ETHPool.abi, KRAP_ETHPool.address);
    let ampl_pool = new web3.eth.Contract(KRAP_uAMPLPool.abi, KRAP_uAMPLPool.address);
    let yfi_pool = new web3.eth.Contract(KRAP_YFIPool.abi, KRAP_YFIPool.address);
    let lend_pool = new web3.eth.Contract(KRAP_LENDPool.abi, KRAP_LENDPool.address);
    let mkr_pool = new web3.eth.Contract(KRAP_MKRPool.abi, KRAP_MKRPool.address);
    let snx_pool = new web3.eth.Contract(KRAP_SNXPool.abi, KRAP_SNXPool.address);
    let comp_pool = new web3.eth.Contract(KRAP_COMPPool.abi, KRAP_COMPPool.address);
    let link_pool = new web3.eth.Contract(KRAP_LINKPool.abi, KRAP_LINKPool.address);
    let yfii_pool = new web3.eth.Contract(KRAP_YFIIPool.abi, KRAP_YFIIPool.address);
    let knc_pool = new web3.eth.Contract(KRAP_KNCPool.abi, KRAP_KNCPool.address);
    let ycrv_pool = new web3.eth.Contract(KRAPIncentivizer.abi, KRAPIncentivizer.address);

    console.log("setting distributor");
    await Promise.all([
        eth_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        ampl_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        yfi_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        ycrv_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        lend_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        mkr_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        snx_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        comp_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        link_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        yfii_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        knc_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        ycrv_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      ]);

    let twenty = web3.utils.toBN(10**3).mul(web3.utils.toBN(10**18)).mul(web3.utils.toBN(200));
    let one_five = web3.utils.toBN(10**3).mul(web3.utils.toBN(10**18)).mul(web3.utils.toBN(1500));

    console.log("transfering and notifying");
    console.log("eth");
    await Promise.all([
      krap.transfer(KRAP_ETHPool.address, twenty.toString()),
      krap.transfer(KRAP_uAMPLPool.address, twenty.toString()),
      krap.transfer(KRAP_YFIPool.address, twenty.toString()),
      krap.transfer(KRAP_LENDPool.address, twenty.toString()),
      krap.transfer(KRAP_MKRPool.address, twenty.toString()),
      krap.transfer(KRAP_SNXPool.address, twenty.toString()),
      krap.transfer(KRAP_COMPPool.address, twenty.toString()),
      krap.transfer(KRAP_LINKPool.address, twenty.toString()),
      krap.transfer(KRAP_YFIIPool.address, twenty.toString()),
      krap.transfer(KRAP_KNCPool.address, twenty.toString()),
      krap._setIncentivizer(KRAPIncentivizer.address),
    ]);

    await Promise.all([
      eth_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      ampl_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      yfi_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      lend_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      mkr_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      snx_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      comp_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      link_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      yfii_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      knc_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),

      // incentives is a minter and prepopulates itself.
      ycrv_pool.methods.notifyRewardAmount("0").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 500000}),
    ]);

    await Promise.all([
      eth_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      ampl_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      yfi_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      lend_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      mkr_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      snx_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      comp_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      link_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      yfii_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      knc_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      ycrv_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
    ]);
    await Promise.all([
      eth_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      ampl_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      yfi_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      lend_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      mkr_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      snx_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      comp_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      link_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      yfii_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      knc_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      ycrv_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
    ]);
  }

  await Promise.all([
    krap._setPendingGov(Timelock.address),
    yReserves._setPendingGov(Timelock.address),
    yRebaser._setPendingGov(Timelock.address),
  ]);

  await Promise.all([
      tl.executeTransaction(
        KRAPProxy.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      tl.executeTransaction(
        KRAPReserves.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      tl.executeTransaction(
        KRAPRebaser.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),
  ]);
  await tl.setPendingAdmin(Gov.address);
  await gov.__acceptAdmin();
  await gov.__abdicate();
}
