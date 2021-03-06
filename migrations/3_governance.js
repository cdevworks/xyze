// ============ Contracts ============


// Token
// deployed first
const KRAPImplementation = artifacts.require("KRAPDelegate");
const KRAPProxy = artifacts.require("KRAPDelegator");

// Rs
// deployed second
const KRAPReserves = artifacts.require("KRAPReserves");
const KRAPRebaser = artifacts.require("KRAPRebaser");

// Governance
// deployed third
const Gov = artifacts.require("GovernorAlpha");
const Timelock = artifacts.require("Timelock");



// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployGovernance(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============
// This is split across multiple files so that
// if the web3 provider craps out, all progress isn't lost.
//
// This is at the expense of having to do 6 extra txs to sync the migrations
// contract

async function deployGovernance(deployer, network) {
  await deployer.deploy(Timelock);
  await deployer.deploy(Gov,
      Timelock.address,
      KRAPProxy.address
  );
}
