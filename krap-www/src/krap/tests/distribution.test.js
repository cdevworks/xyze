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
    defaultGasPrice: "1",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("Distribution", () => {
  let snapshotId;
  let user;
  let user2;
  let ycrv_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  let weth_account = "0xf9e11762d522ea29dd78178c9baf83b7b093aacc";
  let uni_ampl_account = "0x8c545be506a335e24145edd6e01d2754296ff018";
  let comp_account = "0xc89b6f0146642688bb254bf93c28fccf1e182c81";
  let lend_account = "0x3b08aa814bea604917418a9f0907e7fc430e742c";
  let link_account = "0xbe6977e08d4479c0a6777539ae0e8fa27be4e9d6";
  let mkr_account = "0xf37216a8ac034d08b4663108d7532dfcb44583ed";
  let snx_account = "0xb696d629cd0a00560151a434f6b4478ad6c228d7"
  let yfi_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  beforeAll(async () => {
    const accounts = await krap.web3.eth.getAccounts();
    krap.addAccount(accounts[0]);
    user = accounts[0];
    krap.addAccount(accounts[1]);
    user2 = accounts[1];
    snapshotId = await krap.testing.snapshot();
  });

  beforeEach(async () => {
    await krap.testing.resetEVM("0x2");
  });

  describe("pool failures", () => {
    test("cant join pool 1s early", async () => {
      await krap.testing.resetEVM("0x2");
      let a = await krap.web3.eth.getBlock('latest');

      let starttime = await krap.contracts.eth_pool.methods.starttime().call();

      expect(krap.toBigN(a["timestamp"]).toNumber()).toBeLessThan(krap.toBigN(starttime).toNumber());

      //console.log("starttime", a["timestamp"], starttime);
      await krap.contracts.weth.methods.approve(krap.contracts.eth_pool.options.address, -1).send({from: user});

      await krap.testing.expectThrow(
        krap.contracts.eth_pool.methods.stake(
          krap.toBigN(200).times(krap.toBigN(10**18)).toString()
        ).send({
          from: user,
          gas: 300000
        })
      , "not start");


      a = await krap.web3.eth.getBlock('latest');

      starttime = await krap.contracts.ampl_pool.methods.starttime().call();

      expect(krap.toBigN(a["timestamp"]).toNumber()).toBeLessThan(krap.toBigN(starttime).toNumber());

      //console.log("starttime", a["timestamp"], starttime);

      await krap.contracts.UNIAmpl.methods.approve(krap.contracts.ampl_pool.options.address, -1).send({from: user});

      await krap.testing.expectThrow(krap.contracts.ampl_pool.methods.stake(
        "5016536322915819"
      ).send({
        from: user,
        gas: 300000
      }), "not start");
    });

    test("cant join pool 2 early", async () => {

    });

    test("cant withdraw more than deposited", async () => {
      await krap.testing.resetEVM("0x2");
      let a = await krap.web3.eth.getBlock('latest');

      await krap.contracts.weth.methods.transfer(user, krap.toBigN(2000).times(krap.toBigN(10**18)).toString()).send({
        from: weth_account
      });
      await krap.contracts.UNIAmpl.methods.transfer(user, "5000000000000000").send({
        from: uni_ampl_account
      });

      let starttime = await krap.contracts.eth_pool.methods.starttime().call();

      let waittime = starttime - a["timestamp"];
      if (waittime > 0) {
        await krap.testing.increaseTime(waittime);
      }

      await krap.contracts.weth.methods.approve(krap.contracts.eth_pool.options.address, -1).send({from: user});

      await krap.contracts.eth_pool.methods.stake(
        krap.toBigN(200).times(krap.toBigN(10**18)).toString()
      ).send({
        from: user,
        gas: 300000
      });

      await krap.contracts.UNIAmpl.methods.approve(krap.contracts.ampl_pool.options.address, -1).send({from: user});

      await krap.contracts.ampl_pool.methods.stake(
        "5000000000000000"
      ).send({
        from: user,
        gas: 300000
      });

      await krap.testing.expectThrow(krap.contracts.ampl_pool.methods.withdraw(
        "5016536322915820"
      ).send({
        from: user,
        gas: 300000
      }), "");

      await krap.testing.expectThrow(krap.contracts.eth_pool.methods.withdraw(
        krap.toBigN(201).times(krap.toBigN(10**18)).toString()
      ).send({
        from: user,
        gas: 300000
      }), "");

    });
  });

  describe("incentivizer pool", () => {
    test("joining and exiting", async() => {
      await krap.testing.resetEVM("0x2");

      await krap.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
        from: ycrv_account
      });

      await krap.contracts.weth.methods.transfer(user, krap.toBigN(2000).times(krap.toBigN(10**18)).toString()).send({
        from: weth_account
      });

      let a = await krap.web3.eth.getBlock('latest');

      let starttime = await krap.contracts.eth_pool.methods.starttime().call();

      let waittime = starttime - a["timestamp"];
      if (waittime > 0) {
        await krap.testing.increaseTime(waittime);
      } else {
        console.log("late entry", waittime)
      }

      await krap.contracts.weth.methods.approve(krap.contracts.eth_pool.options.address, -1).send({from: user});

      await krap.contracts.eth_pool.methods.stake(
        "2000000000000000000000"
      ).send({
        from: user,
        gas: 300000
      });

      let earned = await krap.contracts.eth_pool.methods.earned(user).call();

      let rr = await krap.contracts.eth_pool.methods.rewardRate().call();

      let rpt = await krap.contracts.eth_pool.methods.rewardPerToken().call();
      //console.log(earned, rr, rpt);
      await krap.testing.increaseTime(86400);
      // await krap.testing.mineBlock();

      earned = await krap.contracts.eth_pool.methods.earned(user).call();

      rpt = await krap.contracts.eth_pool.methods.rewardPerToken().call();

      let ysf = await krap.contracts.krap.methods.krapsScalingFactor().call();

      console.log(earned, ysf, rpt);

      let j = await krap.contracts.eth_pool.methods.getReward().send({
        from: user,
        gas: 300000
      });

      let krap_bal = await krap.contracts.krap.methods.balanceOf(user).call()

      console.log("krap bal", krap_bal)
      // start rebasing
        //console.log("approve krap")
        await krap.contracts.krap.methods.approve(
          krap.contracts.uni_router.options.address,
          -1
        ).send({
          from: user,
          gas: 80000
        });
        //console.log("approve ycrv")
        await krap.contracts.ycrv.methods.approve(
          krap.contracts.uni_router.options.address,
          -1
        ).send({
          from: user,
          gas: 80000
        });

        let ycrv_bal = await krap.contracts.ycrv.methods.balanceOf(user).call()

        console.log("ycrv_bal bal", ycrv_bal)

        console.log("add liq/ create pool")
        await krap.contracts.uni_router.methods.addLiquidity(
          krap.contracts.krap.options.address,
          krap.contracts.ycrv.options.address,
          krap_bal,
          krap_bal,
          krap_bal,
          krap_bal,
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

        await krap.contracts.uni_pair.methods.approve(
          krap.contracts.ycrv_pool.options.address,
          -1
        ).send({
          from: user,
          gas: 300000
        });

        starttime = await krap.contracts.ycrv_pool.methods.starttime().call();

        a = await krap.web3.eth.getBlock('latest');

        waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await krap.testing.increaseTime(waittime);
        } else {
          console.log("late entry, pool 2", waittime)
        }

        await krap.contracts.ycrv_pool.methods.stake(bal).send({from: user, gas: 400000});


        earned = await krap.contracts.ampl_pool.methods.earned(user).call();

        rr = await krap.contracts.ampl_pool.methods.rewardRate().call();

        rpt = await krap.contracts.ampl_pool.methods.rewardPerToken().call();

        console.log(earned, rr, rpt);

        await krap.testing.increaseTime(625000 + 1000);

        earned = await krap.contracts.ampl_pool.methods.earned(user).call();

        rr = await krap.contracts.ampl_pool.methods.rewardRate().call();

        rpt = await krap.contracts.ampl_pool.methods.rewardPerToken().call();

        console.log(earned, rr, rpt);

        await krap.contracts.ycrv_pool.methods.exit().send({from: user, gas: 400000});

        krap_bal = await krap.contracts.krap.methods.balanceOf(user).call();


        expect(krap.toBigN(krap_bal).toNumber()).toBeGreaterThan(0)
        console.log("krap bal after staking in pool 2", krap_bal);
    });
  });

  describe("ampl", () => {
    test("rewards from pool 1s ampl", async () => {
        await krap.testing.resetEVM("0x2");

        await krap.contracts.UNIAmpl.methods.transfer(user, "5000000000000000").send({
          from: uni_ampl_account
        });
        let a = await krap.web3.eth.getBlock('latest');

        let starttime = await krap.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await krap.testing.increaseTime(waittime);
        } else {
          //console.log("missed entry");
        }

        await krap.contracts.UNIAmpl.methods.approve(krap.contracts.ampl_pool.options.address, -1).send({from: user});

        await krap.contracts.ampl_pool.methods.stake(
          "5000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await krap.contracts.ampl_pool.methods.earned(user).call();

        let rr = await krap.contracts.ampl_pool.methods.rewardRate().call();

        let rpt = await krap.contracts.ampl_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await krap.testing.increaseTime(625000 + 100);
        // await krap.testing.mineBlock();

        earned = await krap.contracts.ampl_pool.methods.earned(user).call();

        rpt = await krap.contracts.ampl_pool.methods.rewardPerToken().call();

        let ysf = await krap.contracts.krap.methods.krapsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let krap_bal = await krap.contracts.krap.methods.balanceOf(user).call()

        let j = await krap.contracts.ampl_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        // let k = await krap.contracts.eth_pool.methods.exit().send({
        //   from: user,
        //   gas: 300000
        // });
        //
        // //console.log(k.events)

        // weth_bal = await krap.contracts.weth.methods.balanceOf(user).call()

        // expect(weth_bal).toBe(krap.toBigN(2000).times(krap.toBigN(10**18)).toString())

        let ampl_bal = await krap.contracts.UNIAmpl.methods.balanceOf(user).call()

        expect(ampl_bal).toBe("5000000000000000")


        let krap_bal2 = await krap.contracts.krap.methods.balanceOf(user).call()

        let two_fity = krap.toBigN(250).times(krap.toBigN(10**3)).times(krap.toBigN(10**18))
        expect(krap.toBigN(krap_bal2).minus(krap.toBigN(krap_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("eth", () => {
    test("rewards from pool 1s eth", async () => {
        await krap.testing.resetEVM("0x2");

        await krap.contracts.weth.methods.transfer(user, krap.toBigN(2000).times(krap.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await krap.web3.eth.getBlock('latest');

        let starttime = await krap.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await krap.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await krap.contracts.weth.methods.approve(krap.contracts.eth_pool.options.address, -1).send({from: user});

        await krap.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await krap.contracts.eth_pool.methods.earned(user).call();

        let rr = await krap.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await krap.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await krap.testing.increaseTime(625000 + 100);
        // await krap.testing.mineBlock();

        earned = await krap.contracts.eth_pool.methods.earned(user).call();

        rpt = await krap.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await krap.contracts.krap.methods.krapsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let krap_bal = await krap.contracts.krap.methods.balanceOf(user).call()

        let j = await krap.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await krap.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let krap_bal2 = await krap.contracts.krap.methods.balanceOf(user).call()

        let two_fity = krap.toBigN(250).times(krap.toBigN(10**3)).times(krap.toBigN(10**18))
        expect(krap.toBigN(krap_bal2).minus(krap.toBigN(krap_bal)).toString()).toBe(two_fity.times(1).toString())
    });
    test("rewards from pool 1s eth with rebase", async () => {
        await krap.testing.resetEVM("0x2");

        await krap.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
          from: ycrv_account
        });

        await krap.contracts.weth.methods.transfer(user, krap.toBigN(2000).times(krap.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await krap.web3.eth.getBlock('latest');

        let starttime = await krap.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await krap.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await krap.contracts.weth.methods.approve(krap.contracts.eth_pool.options.address, -1).send({from: user});

        await krap.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await krap.contracts.eth_pool.methods.earned(user).call();

        let rr = await krap.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await krap.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await krap.testing.increaseTime(125000 + 100);
        // await krap.testing.mineBlock();

        earned = await krap.contracts.eth_pool.methods.earned(user).call();

        rpt = await krap.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await krap.contracts.krap.methods.krapsScalingFactor().call();

        //console.log(earned, ysf, rpt);




        let j = await krap.contracts.eth_pool.methods.getReward().send({
          from: user,
          gas: 300000
        });

        let krap_bal = await krap.contracts.krap.methods.balanceOf(user).call()

        console.log("krap bal", krap_bal)
        // start rebasing
          //console.log("approve krap")
          await krap.contracts.krap.methods.approve(
            krap.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });
          //console.log("approve ycrv")
          await krap.contracts.ycrv.methods.approve(
            krap.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });

          let ycrv_bal = await krap.contracts.ycrv.methods.balanceOf(user).call()

          console.log("ycrv_bal bal", ycrv_bal)

          console.log("add liq/ create pool")
          await krap.contracts.uni_router.methods.addLiquidity(
            krap.contracts.krap.options.address,
            krap.contracts.ycrv.options.address,
            krap_bal,
            krap_bal,
            krap_bal,
            krap_bal,
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
          //console.log("init swap")
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

          // trade back for easier calcs later
          //console.log("swap 0")
          await krap.contracts.uni_router.methods.swapExactTokensForTokens(
            "10000000000000000",
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

          await krap.testing.increaseTime(43200);

          //console.log("init twap")
          await krap.contracts.rebaser.methods.init_twap().send({
            from: user,
            gas: 500000
          });

          //console.log("first swap")
          await krap.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000000",
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
          //console.log("second swap")
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

          a = await krap.web3.eth.getBlock('latest');

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

          let bal1 = await krap.contracts.krap.methods.balanceOf(user).call();

          let resKRAP = await krap.contracts.krap.methods.balanceOf(krap.contracts.reserves.options.address).call();

          let resycrv = await krap.contracts.ycrv.methods.balanceOf(krap.contracts.reserves.options.address).call();

          // new balance > old balance
          expect(krap.toBigN(bal).toNumber()).toBeLessThan(krap.toBigN(bal1).toNumber());
          // increases reserves
          expect(krap.toBigN(resycrv).toNumber()).toBeGreaterThan(0);

          r = await krap.contracts.uni_pair.methods.getReserves().call();
          q = await krap.contracts.uni_router.methods.quote(krap.toBigN(10**18).toString(), r[0], r[1]).call();
          console.log("quote", q);
          // not below peg
          expect(krap.toBigN(q).toNumber()).toBeGreaterThan(krap.toBigN(10**18).toNumber());


        await krap.testing.increaseTime(525000 + 100);


        j = await krap.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });
        //console.log(j.events)

        let weth_bal = await krap.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let krap_bal2 = await krap.contracts.krap.methods.balanceOf(user).call()

        let two_fity = krap.toBigN(250).times(krap.toBigN(10**3)).times(krap.toBigN(10**18))
        expect(
          krap.toBigN(krap_bal2).minus(krap.toBigN(krap_bal)).toNumber()
        ).toBeGreaterThan(two_fity.toNumber())
    });
    test("rewards from pool 1s eth with negative rebase", async () => {
        await krap.testing.resetEVM("0x2");

        await krap.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
          from: ycrv_account
        });

        await krap.contracts.weth.methods.transfer(user, krap.toBigN(2000).times(krap.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await krap.web3.eth.getBlock('latest');

        let starttime = await krap.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await krap.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await krap.contracts.weth.methods.approve(krap.contracts.eth_pool.options.address, -1).send({from: user});

        await krap.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await krap.contracts.eth_pool.methods.earned(user).call();

        let rr = await krap.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await krap.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await krap.testing.increaseTime(125000 + 100);
        // await krap.testing.mineBlock();

        earned = await krap.contracts.eth_pool.methods.earned(user).call();

        rpt = await krap.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await krap.contracts.krap.methods.krapsScalingFactor().call();

        //console.log(earned, ysf, rpt);




        let j = await krap.contracts.eth_pool.methods.getReward().send({
          from: user,
          gas: 300000
        });

        let krap_bal = await krap.contracts.krap.methods.balanceOf(user).call()

        console.log("krap bal", krap_bal)
        // start rebasing
          //console.log("approve krap")
          await krap.contracts.krap.methods.approve(
            krap.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });
          //console.log("approve ycrv")
          await krap.contracts.ycrv.methods.approve(
            krap.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });

          let ycrv_bal = await krap.contracts.ycrv.methods.balanceOf(user).call()

          console.log("ycrv_bal bal", ycrv_bal)

          krap_bal = krap.toBigN(krap_bal);
          console.log("add liq/ create pool")
          await krap.contracts.uni_router.methods.addLiquidity(
            krap.contracts.krap.options.address,
            krap.contracts.ycrv.options.address,
            krap_bal.times(.1).toString(),
            krap_bal.times(.1).toString(),
            krap_bal.times(.1).toString(),
            krap_bal.times(.1).toString(),
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
          //console.log("init swap")
          await krap.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000000",
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

          // trade back for easier calcs later
          //console.log("swap 0")
          await krap.contracts.uni_router.methods.swapExactTokensForTokens(
            "100000000000000",
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

          //console.log("init twap")
          await krap.contracts.rebaser.methods.init_twap().send({
            from: user,
            gas: 500000
          });

          //console.log("first swap")
          await krap.contracts.uni_router.methods.swapExactTokensForTokens(
            "100000000000000",
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
          //console.log("second swap")
          await krap.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000",
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

          a = await krap.web3.eth.getBlock('latest');

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

          let bal1 = await krap.contracts.krap.methods.balanceOf(user).call();

          let resKRAP = await krap.contracts.krap.methods.balanceOf(krap.contracts.reserves.options.address).call();

          let resycrv = await krap.contracts.ycrv.methods.balanceOf(krap.contracts.reserves.options.address).call();

          expect(krap.toBigN(bal1).toNumber()).toBeLessThan(krap.toBigN(bal).toNumber());
          expect(krap.toBigN(resycrv).toNumber()).toBe(0);

          r = await krap.contracts.uni_pair.methods.getReserves().call();
          q = await krap.contracts.uni_router.methods.quote(krap.toBigN(10**18).toString(), r[0], r[1]).call();
          console.log("quote", q);
          // not below peg
          expect(krap.toBigN(q).toNumber()).toBeLessThan(krap.toBigN(10**18).toNumber());


        await krap.testing.increaseTime(525000 + 100);


        j = await krap.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });
        //console.log(j.events)

        let weth_bal = await krap.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let krap_bal2 = await krap.contracts.krap.methods.balanceOf(user).call()

        let two_fity = krap.toBigN(250).times(krap.toBigN(10**3)).times(krap.toBigN(10**18))
        expect(
          krap.toBigN(krap_bal2).minus(krap.toBigN(krap_bal)).toNumber()
        ).toBeLessThan(two_fity.toNumber())
    });
  });

  describe("yfi", () => {
    test("rewards from pool 1s yfi", async () => {
        await krap.testing.resetEVM("0x2");
        await krap.contracts.yfi.methods.transfer(user, "500000000000000000000").send({
          from: yfi_account
        });

        let a = await krap.web3.eth.getBlock('latest');

        let starttime = await krap.contracts.yfi_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await krap.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await krap.contracts.yfi.methods.approve(krap.contracts.yfi_pool.options.address, -1).send({from: user});

        await krap.contracts.yfi_pool.methods.stake(
          "500000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await krap.contracts.yfi_pool.methods.earned(user).call();

        let rr = await krap.contracts.yfi_pool.methods.rewardRate().call();

        let rpt = await krap.contracts.yfi_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await krap.testing.increaseTime(625000 + 100);
        // await krap.testing.mineBlock();

        earned = await krap.contracts.yfi_pool.methods.earned(user).call();

        rpt = await krap.contracts.yfi_pool.methods.rewardPerToken().call();

        let ysf = await krap.contracts.krap.methods.krapsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let krap_bal = await krap.contracts.krap.methods.balanceOf(user).call()

        let j = await krap.contracts.yfi_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await krap.contracts.yfi.methods.balanceOf(user).call()

        expect(weth_bal).toBe("500000000000000000000")


        let krap_bal2 = await krap.contracts.krap.methods.balanceOf(user).call()

        let two_fity = krap.toBigN(250).times(krap.toBigN(10**3)).times(krap.toBigN(10**18))
        expect(krap.toBigN(krap_bal2).minus(krap.toBigN(krap_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("comp", () => {
    test("rewards from pool 1s comp", async () => {
        await krap.testing.resetEVM("0x2");
        await krap.contracts.comp.methods.transfer(user, "50000000000000000000000").send({
          from: comp_account
        });

        let a = await krap.web3.eth.getBlock('latest');

        let starttime = await krap.contracts.comp_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await krap.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await krap.contracts.comp.methods.approve(krap.contracts.comp_pool.options.address, -1).send({from: user});

        await krap.contracts.comp_pool.methods.stake(
          "50000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await krap.contracts.comp_pool.methods.earned(user).call();

        let rr = await krap.contracts.comp_pool.methods.rewardRate().call();

        let rpt = await krap.contracts.comp_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await krap.testing.increaseTime(625000 + 100);
        // await krap.testing.mineBlock();

        earned = await krap.contracts.comp_pool.methods.earned(user).call();

        rpt = await krap.contracts.comp_pool.methods.rewardPerToken().call();

        let ysf = await krap.contracts.krap.methods.krapsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let krap_bal = await krap.contracts.krap.methods.balanceOf(user).call()

        let j = await krap.contracts.comp_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await krap.contracts.comp.methods.balanceOf(user).call()

        expect(weth_bal).toBe("50000000000000000000000")


        let krap_bal2 = await krap.contracts.krap.methods.balanceOf(user).call()

        let two_fity = krap.toBigN(250).times(krap.toBigN(10**3)).times(krap.toBigN(10**18))
        expect(krap.toBigN(krap_bal2).minus(krap.toBigN(krap_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("lend", () => {
    test("rewards from pool 1s lend", async () => {
        await krap.testing.resetEVM("0x2");
        await krap.web3.eth.sendTransaction({from: user2, to: lend_account, value : krap.toBigN(100000*10**18).toString()});

        await krap.contracts.lend.methods.transfer(user, "10000000000000000000000000").send({
          from: lend_account
        });

        let a = await krap.web3.eth.getBlock('latest');

        let starttime = await krap.contracts.lend_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await krap.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await krap.contracts.lend.methods.approve(krap.contracts.lend_pool.options.address, -1).send({from: user});

        await krap.contracts.lend_pool.methods.stake(
          "10000000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await krap.contracts.lend_pool.methods.earned(user).call();

        let rr = await krap.contracts.lend_pool.methods.rewardRate().call();

        let rpt = await krap.contracts.lend_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await krap.testing.increaseTime(625000 + 100);
        // await krap.testing.mineBlock();

        earned = await krap.contracts.lend_pool.methods.earned(user).call();

        rpt = await krap.contracts.lend_pool.methods.rewardPerToken().call();

        let ysf = await krap.contracts.krap.methods.krapsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let krap_bal = await krap.contracts.krap.methods.balanceOf(user).call()

        let j = await krap.contracts.lend_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await krap.contracts.lend.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000000")


        let krap_bal2 = await krap.contracts.krap.methods.balanceOf(user).call()

        let two_fity = krap.toBigN(250).times(krap.toBigN(10**3)).times(krap.toBigN(10**18))
        expect(krap.toBigN(krap_bal2).minus(krap.toBigN(krap_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("link", () => {
    test("rewards from pool 1s link", async () => {
        await krap.testing.resetEVM("0x2");

        await krap.web3.eth.sendTransaction({from: user2, to: link_account, value : krap.toBigN(100000*10**18).toString()});

        await krap.contracts.link.methods.transfer(user, "10000000000000000000000000").send({
          from: link_account
        });

        let a = await krap.web3.eth.getBlock('latest');

        let starttime = await krap.contracts.link_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await krap.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await krap.contracts.link.methods.approve(krap.contracts.link_pool.options.address, -1).send({from: user});

        await krap.contracts.link_pool.methods.stake(
          "10000000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await krap.contracts.link_pool.methods.earned(user).call();

        let rr = await krap.contracts.link_pool.methods.rewardRate().call();

        let rpt = await krap.contracts.link_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await krap.testing.increaseTime(625000 + 100);
        // await krap.testing.mineBlock();

        earned = await krap.contracts.link_pool.methods.earned(user).call();

        rpt = await krap.contracts.link_pool.methods.rewardPerToken().call();

        let ysf = await krap.contracts.krap.methods.krapsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let krap_bal = await krap.contracts.krap.methods.balanceOf(user).call()

        let j = await krap.contracts.link_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await krap.contracts.link.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000000")


        let krap_bal2 = await krap.contracts.krap.methods.balanceOf(user).call()

        let two_fity = krap.toBigN(250).times(krap.toBigN(10**3)).times(krap.toBigN(10**18))
        expect(krap.toBigN(krap_bal2).minus(krap.toBigN(krap_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("mkr", () => {
    test("rewards from pool 1s mkr", async () => {
        await krap.testing.resetEVM("0x2");
        await krap.web3.eth.sendTransaction({from: user2, to: mkr_account, value : krap.toBigN(100000*10**18).toString()});
        let eth_bal = await krap.web3.eth.getBalance(mkr_account);

        await krap.contracts.mkr.methods.transfer(user, "10000000000000000000000").send({
          from: mkr_account
        });

        let a = await krap.web3.eth.getBlock('latest');

        let starttime = await krap.contracts.mkr_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await krap.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await krap.contracts.mkr.methods.approve(krap.contracts.mkr_pool.options.address, -1).send({from: user});

        await krap.contracts.mkr_pool.methods.stake(
          "10000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await krap.contracts.mkr_pool.methods.earned(user).call();

        let rr = await krap.contracts.mkr_pool.methods.rewardRate().call();

        let rpt = await krap.contracts.mkr_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await krap.testing.increaseTime(625000 + 100);
        // await krap.testing.mineBlock();

        earned = await krap.contracts.mkr_pool.methods.earned(user).call();

        rpt = await krap.contracts.mkr_pool.methods.rewardPerToken().call();

        let ysf = await krap.contracts.krap.methods.krapsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let krap_bal = await krap.contracts.krap.methods.balanceOf(user).call()

        let j = await krap.contracts.mkr_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await krap.contracts.mkr.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000")


        let krap_bal2 = await krap.contracts.krap.methods.balanceOf(user).call()

        let two_fity = krap.toBigN(250).times(krap.toBigN(10**3)).times(krap.toBigN(10**18))
        expect(krap.toBigN(krap_bal2).minus(krap.toBigN(krap_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("snx", () => {
    test("rewards from pool 1s snx", async () => {
        await krap.testing.resetEVM("0x2");

        await krap.web3.eth.sendTransaction({from: user2, to: snx_account, value : krap.toBigN(100000*10**18).toString()});

        let snx_bal = await krap.contracts.snx.methods.balanceOf(snx_account).call();

        console.log(snx_bal)

        await krap.contracts.snx.methods.transfer(user, snx_bal).send({
          from: snx_account
        });

        snx_bal = await krap.contracts.snx.methods.balanceOf(user).call();

        console.log(snx_bal)

        let a = await krap.web3.eth.getBlock('latest');

        let starttime = await krap.contracts.snx_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await krap.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await krap.contracts.snx.methods.approve(krap.contracts.snx_pool.options.address, -1).send({from: user});

        await krap.contracts.snx_pool.methods.stake(
          snx_bal
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await krap.contracts.snx_pool.methods.earned(user).call();

        let rr = await krap.contracts.snx_pool.methods.rewardRate().call();

        let rpt = await krap.contracts.snx_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await krap.testing.increaseTime(625000 + 100);
        // await krap.testing.mineBlock();

        earned = await krap.contracts.snx_pool.methods.earned(user).call();

        rpt = await krap.contracts.snx_pool.methods.rewardPerToken().call();

        let ysf = await krap.contracts.krap.methods.krapsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let krap_bal = await krap.contracts.krap.methods.balanceOf(user).call()

        let j = await krap.contracts.snx_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await krap.contracts.snx.methods.balanceOf(user).call()

        expect(weth_bal).toBe(snx_bal)


        let krap_bal2 = await krap.contracts.krap.methods.balanceOf(user).call()

        let two_fity = krap.toBigN(250).times(krap.toBigN(10**3)).times(krap.toBigN(10**18))
        expect(krap.toBigN(krap_bal2).minus(krap.toBigN(krap_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });
})
