// ============ Contracts ============

// Token
// deployed first
const KRAPImplementation = artifacts.require("KRAPDelegate");
const KRAPProxy = artifacts.require("KRAPDelegator");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployToken(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployToken(deployer, network) {
  await deployer.deploy(KRAPImplementation);
  await deployer.deploy(KRAPProxy,
    "KRAP",
    "KRAP",
    18,
    "2000000000000000000000000",
    KRAPImplementation.address,
    "0x"
  );
}
