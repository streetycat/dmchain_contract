let test = require('test');
test.setup();

let test_util = require('../../test_util');
const coroutine = require("coroutine")
test_util.runBIOS();

describe(`deliver`, () => {
    let contract;
    let fibos, ctx, user, miner, lp, lp2;
    let order_id;
    let data = [];

    before(() => {
        fibos = test_util.getFIBOS();
        contract = "eosio.token";
        user = test_util.user(fibos);
        miner = test_util.user(fibos);
        lp = test_util.user(fibos);
        lp2 = test_util.user(fibos);
        ctx = fibos.contractSync(contract);
        for (let i = 0; i < 4; i++) {
            data.push(test_util.random_string(9));
        }
        ctx.excreateSync("datamall", `1000000000 PST`, `0 PST`, 0, {
            authorization: "datamall"
        })
        ctx.excreateSync("datamall", `1000000000.0000 DMC`, `0.0000 DMC`, 0, {
            authorization: "datamall"
        })
        ctx.excreateSync("datamall", `1000000000.00000000 RSI`, `0.00000000 RSI`, 0, {
            authorization: "datamall"
        })
        ctx.exissueSync(miner, `100.0000 DMC@datamall`, `issue 100 DMC`, {
            authorization: "datamall"
        });
        ctx.increaseSync(miner, "10.0000 DMC@datamall", miner, {
            authorization: miner
        });
        ctx.setmakerrate(miner, 0.5, {
            authorization: miner
        });
        ctx.exissueSync(lp, `100000.0000 DMC@datamall`, `issue 100000 DMC`, {
            authorization: "datamall"
        });
        ctx.increaseSync(lp, "5.0000 DMC@datamall", miner, {
            authorization: lp
        });
        ctx.exissueSync(lp2, `100000.0000 DMC@datamall`, `issue 100000 DMC`, {
            authorization: "datamall"
        });
        ctx.increaseSync(lp2, "5.0000 DMC@datamall", miner, {
            authorization: lp2
        });
    });

    it("setdmcconfig", () => {
        ctx.setdmcconfigSync("claiminter", 2, {
            authorization: "datamall"
        });
    })

    it("addorder", () => {
        ctx.exissueSync(miner, `150 PST@datamall`, `issue 150 PST`, {
            authorization: "datamall"
        });
        ctx.exissueSync(user, `100000.0000 DMC@datamall`, `issue 100000 DMC`, {
            authorization: "datamall"
        });

        ctx.billSync(miner, "3 PST@datamall", 0.011, "test", {
            authorization: miner
        });
        coroutine.sleep(2 * 1000);
        let bill_id = fibos.getTableRowsSync(true, contract, miner, "stakerec").rows[0].bill_id;

        ctx.orderSync({
            "owner": user,
            "miner": miner,
            "bill_id": bill_id,
            "asset": "1 PST@datamall",
            "memo": "test"
        }, {
            authorization: user
        });
        let order_info = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcorder").rows;
        order_id = order_info[0].order_id;
        ctx.addordassetSync({
            "sender": user,
            "order_id": order_id,
            "quantity": "0.0110 DMC@datamall",
        }, {
            authorization: user
        })
        let result = fibos.getTableRowsSync(true, contract, contract, "dmcorder")
        console.log(result)
    })

    describe(`claimorder`, () => {
        it(`must claim in valid time`, () => {
            assert.throws(() => {
                ctx.claimorderSync({
                    payer: miner,
                    order_id: order_id,
                }, {
                    authorization: miner
                });
            });
        })

        it("user claimorder", () => {
            let result = fibos.getTableRowsSync(true, contract, miner, "accounts");
            console.log(result);
            coroutine.sleep(2 * 1000);
            ctx.claimorderSync({
                payer: miner,
                order_id: order_id,
            }, {
                authorization: miner
            });
            result = fibos.getTableRowsSync(true, contract, miner, "accounts");
            console.log(result);
        });

        it(`can not immediately duplicate claim`, () => {
            assert.throws(() => {
                ctx.claimorderSync({
                    payer: miner,
                    order_id: order_id,
                }, {
                    authorization: miner
                });
            });
        })

        it(`claim after interval`, () => {
            let result = fibos.getTableRowsSync(true, contract, miner, "accounts");
            console.log("miner before result", result);
            let result2 = fibos.getTableRowsSync(true, contract, lp, "accounts");
            console.log("lp before result", result2);
            console.log(result2);
            coroutine.sleep(2 * 1000);
            ctx.claimorderSync({
                payer: miner,
                order_id: order_id,
            }, {
                authorization: miner
            });
            result = fibos.getTableRowsSync(true, contract, miner, "accounts");
            console.log("miner after result:", result);
            result2 = fibos.getTableRowsSync(true, contract, lp, "accounts");
            console.log("lp after result:", result2);
        })

        it(`can not duplicate claim`, () => {
            coroutine.sleep(2 * 1000);
            assert.throws(() => {
                ctx.claimorderSync({
                    payer: miner,
                    order_id: order_id,
                }, {
                    authorization: miner
                });
            });
        })
    });
});

require.main === module && test.run(console.DEBUG);