import {
  Yam
} from "../index.js";
import * as Types from "../lib/types.js";
import {
  addressMap
} from "../lib/constants.js";
import {
  decimalToString,
  stringToDecimal
} from "../lib/Helpers.js"


export const krap = new Yam(
  "http://localhost:8545/",
  // "http://127.0.0.1:9545/",
  "1001",
  true, {
    defaultAccount: "",
    defaultConfirmations: 1,
    autoGasMultiplier: 1.5,
    testing: false,
    defaultGas: "6000000",
    defaultGasPrice: "1000000000000",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("rebase_tests", () => {
  let snapshotId;
  let user;
  let new_user;
  // let unlocked_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  let unlocked_account = "0x681148725731f213b0187a3cbef215c291d85a3e";

  beforeAll(async () => {
    const accounts = await krap.web3.eth.getAccounts();
    krap.addAccount(accounts[0]);
    user = accounts[0];
    new_user = accounts[1];
    snapshotId = await krap.testing.snapshot();
  });

  beforeEach(async () => {
    await krap.testing.resetEVM("0x2");
    let a = await krap.contracts.ycrv.methods.transfer(user, "2000000000000000000000000").send({
      from: unlocked_account
    });
  });

  describe("rebase", () => {
    test("user has ycrv", async () => {
      let bal0 = await krap.contracts.ycrv.methods.balanceOf(user).call();
      expect(bal0).toBe("2000000000000000000000000");
    });
    test("create pair", async () => {
      await krap.contracts.uni_fact.methods.createPair(
        krap.contracts.ycrv.options.address,
        krap.contracts.krap.options.address
      ).send({
        from: user,
        gas: 8000000
      })
    });
    test("mint pair", async () => {
      await krap.contracts.krap.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await krap.contracts.ycrv.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await krap.contracts.uni_router.methods.addLiquidity(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address,
        10000000,
        10000000,
        10000000,
        10000000,
        user,
        1596740361 + 100000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await krap.contracts.uni_fact.methods.getPair(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address
      ).call();
      krap.contracts.uni_pair.options.address = pair;
      let bal = await krap.contracts.uni_pair.methods.balanceOf(user).call();
      expect(krap.toBigN(bal).toNumber()).toBeGreaterThan(100)
    });
    test("init_twap", async () => {
      await krap.contracts.krap.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await krap.contracts.ycrv.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await krap.contracts.uni_router.methods.addLiquidity(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await krap.contracts.uni_fact.methods.getPair(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address
      ).call();
      krap.contracts.uni_pair.options.address = pair;
      let bal = await krap.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await krap.testing.increaseTime(1000);

      await krap.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await krap.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await krap.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(krap.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(krap.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);
    });
    test("activate rebasing", async () => {
      await krap.contracts.krap.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await krap.contracts.ycrv.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await krap.contracts.uni_router.methods.addLiquidity(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await krap.contracts.uni_fact.methods.getPair(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address
      ).call();
      krap.contracts.uni_pair.options.address = pair;
      let bal = await krap.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await krap.testing.increaseTime(1000);

      await krap.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await krap.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await krap.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(krap.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(krap.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);

      await krap.testing.increaseTime(12 * 60 * 60);

      await krap.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });
    });
    test("positive rebasing", async () => {
      await krap.contracts.krap.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await krap.contracts.ycrv.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await krap.contracts.uni_router.methods.addLiquidity(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await krap.contracts.uni_fact.methods.getPair(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address
      ).call();

      krap.contracts.uni_pair.options.address = pair;
      let bal = await krap.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await krap.testing.increaseTime(43200);

      await krap.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000000000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await krap.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await krap.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await krap.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      let res_bal = await krap.contracts.krap.methods.balanceOf(
          krap.contracts.reserves.options.address
      ).call();

      expect(res_bal).toBe("0");

      bal = await krap.contracts.krap.methods.balanceOf(user).call();

      let a = await krap.web3.eth.getBlock('latest');

      let offset = await krap.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = krap.toBigN(offset).toNumber();
      let interval = await krap.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = krap.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await krap.testing.increaseTime(i);

      let r = await krap.contracts.uni_pair.methods.getReserves().call();
      let q = await krap.contracts.uni_router.methods.quote(krap.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre positive rebase", q);

      let b = await krap.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("positive rebase gas used:", b["gasUsed"]);

      let bal1 = await krap.contracts.krap.methods.balanceOf(user).call();

      let resKRAP = await krap.contracts.krap.methods.balanceOf(krap.contracts.reserves.options.address).call();

      let resycrv = await krap.contracts.ycrv.methods.balanceOf(krap.contracts.reserves.options.address).call();

      console.log("bal user, bal krap res, bal res crv", bal1, resKRAP, resycrv);
      r = await krap.contracts.uni_pair.methods.getReserves().call();
      q = await krap.contracts.uni_router.methods.quote(krap.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("post positive rebase quote", q);

      // new balance > old balance
      expect(krap.toBigN(bal).toNumber()).toBeLessThan(krap.toBigN(bal1).toNumber());
      // used full krap reserves
      expect(krap.toBigN(resKRAP).toNumber()).toBe(0);
      // increases reserves
      expect(krap.toBigN(resycrv).toNumber()).toBeGreaterThan(0);


      // not below peg
      expect(krap.toBigN(q).toNumber()).toBeGreaterThan(krap.toBigN(10**18).toNumber());
    });
    test("negative rebasing", async () => {
      await krap.contracts.krap.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await krap.contracts.ycrv.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await krap.contracts.uni_router.methods.addLiquidity(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await krap.contracts.uni_fact.methods.getPair(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address
      ).call();

      krap.contracts.uni_pair.options.address = pair;
      let bal = await krap.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await krap.testing.increaseTime(43200);

      await krap.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await krap.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await krap.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await krap.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await krap.contracts.krap.methods.balanceOf(user).call();

      let a = await krap.web3.eth.getBlock('latest');

      let offset = await krap.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = krap.toBigN(offset).toNumber();
      let interval = await krap.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = krap.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await krap.testing.increaseTime(i);

      let r = await krap.contracts.uni_pair.methods.getReserves().call();
      let q = await krap.contracts.uni_router.methods.quote(krap.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre negative rebase", q);

      let b = await krap.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("negative rebase gas used:", b["gasUsed"]);

      let bal1 = await krap.contracts.krap.methods.balanceOf(user).call();

      let resKRAP = await krap.contracts.krap.methods.balanceOf(krap.contracts.reserves.options.address).call();

      let resycrv = await krap.contracts.ycrv.methods.balanceOf(krap.contracts.reserves.options.address).call();

      // balance decreases
      expect(krap.toBigN(bal1).toNumber()).toBeLessThan(krap.toBigN(bal).toNumber());
      // no increases to reserves
      expect(krap.toBigN(resKRAP).toNumber()).toBe(0);
      expect(krap.toBigN(resycrv).toNumber()).toBe(0);
    });
    test("no rebasing", async () => {
      await krap.contracts.krap.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await krap.contracts.ycrv.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await krap.contracts.uni_router.methods.addLiquidity(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await krap.contracts.uni_fact.methods.getPair(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address
      ).call();

      krap.contracts.uni_pair.options.address = pair;
      let bal = await krap.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await krap.testing.increaseTime(43200);

      await krap.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await krap.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await krap.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await krap.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await krap.contracts.krap.methods.balanceOf(user).call();

      let a = await krap.web3.eth.getBlock('latest');

      let offset = await krap.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = krap.toBigN(offset).toNumber();
      let interval = await krap.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = krap.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await krap.testing.increaseTime(i);

      let r = await krap.contracts.uni_pair.methods.getReserves().call();
      console.log(r, r[0], r[1]);
      let q = await krap.contracts.uni_router.methods.quote(krap.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre no rebase", q);
      let b = await krap.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      console.log("no rebase gas used:", b["gasUsed"]);

      let bal1 = await krap.contracts.krap.methods.balanceOf(user).call();

      let resKRAP = await krap.contracts.krap.methods.balanceOf(krap.contracts.reserves.options.address).call();

      let resycrv = await krap.contracts.ycrv.methods.balanceOf(krap.contracts.reserves.options.address).call();

      // no change
      expect(krap.toBigN(bal1).toNumber()).toBe(krap.toBigN(bal).toNumber());
      // no increases to reserves
      expect(krap.toBigN(resKRAP).toNumber()).toBe(0);
      expect(krap.toBigN(resycrv).toNumber()).toBe(0);
      r = await krap.contracts.uni_pair.methods.getReserves().call();
      q = await krap.contracts.uni_router.methods.quote(krap.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post no rebase", q);
    });
    test("rebasing with KRAP in reserves", async () => {
      await krap.contracts.krap.methods.transfer(krap.contracts.reserves.options.address, krap.toBigN(60000*10**18).toString()).send({from: user});
      await krap.contracts.krap.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await krap.contracts.ycrv.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await krap.contracts.uni_router.methods.addLiquidity(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await krap.contracts.uni_fact.methods.getPair(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address
      ).call();

      krap.contracts.uni_pair.options.address = pair;
      let bal = await krap.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await krap.testing.increaseTime(43200);

      await krap.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await krap.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await krap.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await krap.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await krap.contracts.krap.methods.balanceOf(user).call();

      let a = await krap.web3.eth.getBlock('latest');

      let offset = await krap.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = krap.toBigN(offset).toNumber();
      let interval = await krap.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = krap.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await krap.testing.increaseTime(i);


      let r = await krap.contracts.uni_pair.methods.getReserves().call();
      let q = await krap.contracts.uni_router.methods.quote(krap.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre pos rebase with reserves", q);

      let b = await krap.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });
      //console.log(b.events)

      console.log("positive  with reserves gas used:", b["gasUsed"]);

      let bal1 = await krap.contracts.krap.methods.balanceOf(user).call();

      let resKRAP = await krap.contracts.krap.methods.balanceOf(krap.contracts.reserves.options.address).call();

      let resycrv = await krap.contracts.ycrv.methods.balanceOf(krap.contracts.reserves.options.address).call();

      console.log(bal, bal1, resKRAP, resycrv);
      expect(krap.toBigN(bal).toNumber()).toBeLessThan(krap.toBigN(bal1).toNumber());
      expect(krap.toBigN(resKRAP).toNumber()).toBeGreaterThan(0);
      expect(krap.toBigN(resycrv).toNumber()).toBeGreaterThan(0);
      r = await krap.contracts.uni_pair.methods.getReserves().call();
      q = await krap.contracts.uni_router.methods.quote(krap.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post rebase w/ reserves", q);
      expect(krap.toBigN(q).toNumber()).toBeGreaterThan(krap.toBigN(10**18).toNumber());
    });
  });

  describe("failing", () => {
    test("unitialized rebasing", async () => {
      await krap.testing.expectThrow(krap.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      }), "twap wasnt intitiated, call init_twap()");
    });
    test("no early twap", async () => {
      await krap.testing.expectThrow(krap.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      }), "");
    });
    test("too late rebasing", async () => {
      await krap.contracts.krap.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await krap.contracts.ycrv.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await krap.contracts.uni_router.methods.addLiquidity(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await krap.contracts.uni_fact.methods.getPair(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address
      ).call();

      krap.contracts.uni_pair.options.address = pair;
      let bal = await krap.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await krap.testing.increaseTime(43200);

      await krap.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await krap.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await krap.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await krap.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await krap.contracts.krap.methods.balanceOf(user).call();

      let a = await krap.web3.eth.getBlock('latest');

      let offset = await krap.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = krap.toBigN(offset).toNumber();
      let interval = await krap.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = krap.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      let len = await krap.contracts.rebaser.methods.rebaseWindowLengthSec().call();

      await krap.testing.increaseTime(i + krap.toBigN(len).toNumber()+1);

      let b = await krap.testing.expectThrow(krap.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too late");
    });
    test("too early rebasing", async () => {
      await krap.contracts.krap.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await krap.contracts.ycrv.methods.approve(
        krap.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await krap.contracts.uni_router.methods.addLiquidity(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await krap.contracts.uni_fact.methods.getPair(
        krap.contracts.krap.options.address,
        krap.contracts.ycrv.options.address
      ).call();

      krap.contracts.uni_pair.options.address = pair;
      let bal = await krap.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await krap.testing.increaseTime(43200);

      await krap.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await krap.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await krap.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await krap.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          krap.contracts.ycrv.options.address,
          krap.contracts.krap.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await krap.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });

      bal = await krap.contracts.krap.methods.balanceOf(user).call();

      let a = await krap.web3.eth.getBlock('latest');

      let offset = await krap.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = krap.toBigN(offset).toNumber();
      let interval = await krap.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = krap.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await krap.testing.increaseTime(i - 1);



      let b = await krap.testing.expectThrow(krap.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too early");
    });
  });
});
