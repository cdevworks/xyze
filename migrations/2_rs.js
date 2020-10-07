// ============ Contracts ============

// Token
// deployed first
const KRAPImplementation = artifacts.require("KRAPDelegate");
const KRAPProxy = artifacts.require("KRAPDelegator");

// Rs
// deployed second
const KRAPReserves = artifacts.require("KRAPReserves");
const KRAPRebaser = artifacts.require("KRAPRebaser");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployRs(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployRs(deployer, network) {
  let reserveToken = "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8";
  let uniswap_factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  await deployer.deploy(KRAPReserves, reserveToken, KRAPProxy.address);
  await deployer.deploy(KRAPRebaser,
      KRAPProxy.address,
      reserveToken,
      uniswap_factory,
      KRAPReserves.address
  );
  let rebase = new web3.eth.Contract(KRAPRebaser.abi, KRAPRebaser.address);

  let pair = await rebase.methods.uniswap_pair().call();
  console.log("KRAPProxy address is " + KRAPProxy.address);
  console.log("Uniswap pair is " + pair);
  let krap = await KRAPProxy.deployed();
  await krap._setRebaser(KRAPRebaser.address);
  let reserves = await KRAPReserves.deployed();
  await reserves._setRebaser(KRAPRebaser.address)
}
