let test = require('test');
test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let checkaccount = test_util.checkaccount;
let chekcpststats = test_util.chekcpststats;
const coroutine = require("coroutine");
const { checkstat } = require('../../test_util');
var users = {};

describe(`liquidation, successful only if n = 0.15, m = 0.25 `, () => {
    let contract = "user1"
    let fibos, ctx, name, name1, name2;

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
            test_util.user(fibos, name);
        }
        name1 = test_util.user(fibos);
        name2 = test_util.user(fibos);
        ctx = fibos.contractSync("eosio.token");

        ctx.excreateSync("datamall", `1000000000 PST`, `0 PST`, 0, {
            authorization: "datamall"
        })
        ctx.excreateSync("datamall", `1000000000.0000 DMC`, `0.0000 DMC`, 0, {
            authorization: "datamall"
        })
        ctx.excreateSync("eosio", `1000000000.0000 DMC`, `0.0000 DMC`, 0, {
            authorization: "eosio"
        })
        ctx.excreateSync("datamall", `1000000000.00000000 RSI`, `0.00000000 RSI`, 0, {
            authorization: "datamall"
        })
        ctx.exissueSync("fibos", `1000.0000 DMC@eosio`, `issue 1000 DMC`, {
            authorization: "eosio"
        });
    });

    after(() => {
        require.main === module && test_util.stop();
    });

    it(`maker`, () => {
        ctx.exissueSync("fibos", `1000.0000 DMC@datamall`, `issue 1000 DMC`, {
            authorization: "datamall"
        });
        ctx.increaseSync("fibos", "140.0000 DMC@datamall", "fibos", {
            authorization: "fibos"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner, "fibos");
        assert.deepEqual(r[0].total_staked, {
            "quantity": "140.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].miner_staked, {
            "quantity": "140.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].lps_staked, {
            "quantity": "0.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].lps, []);
    })

    let price;
    it(`bill and order`, () => {
        ctx.exissueSync("fibos", `1000 PST@datamall`, `issue 1000 PST`, {
            authorization: "datamall"
        });
        ctx.billSync("fibos", "100 PST@datamall", 1, "test", {
            authorization: "fibos"
        });
        let s = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        let bill_id = s[0].bill_id;
        ctx.orderSync("fibos", "fibos", bill_id, "5 PST@datamall", "test", {
            authorization: "fibos"
        })
        let p = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcprice").rows;
        price = p[0].price;
        assert.deepEqual(price, "1.00000000000000000");
        chekcpststats(fibos, "fibos", {
            "quantity": "1000 PST",
            "contract": "datamall"
        });
    })

    it(`set rate to 0.2`, () => {
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner_rate, "1.00000000000000000");
        ctx.setmakerrateSync("fibos", 0.2, {
            authorization: "fibos"
        })
        r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner_rate, "0.20000000000000001");
    })

    it(`lp increase, make r == 0.25`, () => {
        ctx.exissueSync(name1, `1000.0000 DMC@datamall`, `issue 1000 DMC`, {
            authorization: "datamall"
        });
        ctx.increaseSync(name1, "110.0000 DMC@datamall", "fibos", {
            authorization: name1
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner, "fibos");
        assert.deepEqual(r[0].total_staked, {
            "quantity": "250.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].miner_staked, {
            "quantity": "140.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].lps_staked, {
            "quantity": "110.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].current_rate, "0.25000000000000000");
        r[0].lps.forEach(element => {
            delete element.updated_at;
        });
        assert.deepEqual(r[0].lps, [
            {
                "owner": name1,
                "staked": {
                    "quantity": "110.0000 DMC",
                    "contract": "datamall"
                }
            }
        ]);
    })

    it(`lp redemption, make r == 0.20`, () => {
        ctx.redemptionSync(name1, "50.0000 DMC@datamall", "fibos", {
            authorization: name1
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner, "fibos");
        assert.deepEqual(r[0].total_staked, {
            "quantity": "200.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].miner_staked, {
            "quantity": "140.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].lps_staked, {
            "quantity": "60.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].current_rate, "0.20000000000000001");
        r[0].lps.forEach(element => {
            delete element.updated_at;
        });
        assert.deepEqual(r[0].lps, [
            {
                "owner": name1,
                "staked": {
                    "quantity": "60.0000 DMC",
                    "contract": "datamall"
                }
            }
        ]);
    })

    it(`miner redemption, error, because r < 0.25`, () => {
        assert.throws(() => {
            ctx.redemptionSync("fibos", "50.0000 DMC@datamall", "fibos", {
                authorization: "fibos"
            })
        });
    })

    it(`lp increase, make r == 0.28`, () => {
        ctx.increaseSync(name1, "80.0000 DMC@datamall", "fibos", {
            authorization: name1
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner, "fibos");
        assert.deepEqual(r[0].total_staked, {
            "quantity": "280.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].miner_staked, {
            "quantity": "140.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].lps_staked, {
            "quantity": "140.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].current_rate, "0.28000000000000003");
        r[0].lps.forEach(element => {
            delete element.updated_at;
        });
        assert.deepEqual(r[0].lps, [
            {
                "owner": name1,
                "staked": {
                    "quantity": "140.0000 DMC",
                    "contract": "datamall"
                }
            }
        ]);
    })

    it(`miner redemption, r 0.28 -> 0.23, fails`, () => {
        assert.throws(() => {
            ctx.redemptionSync("fibos", "50.0000 DMC@datamall", "fibos", {
                authorization: "fibos"
            })
        });
    })

    it(`lp can always redemption `, () => {
        ctx.redemptionSync(name1, "50.0000 DMC@datamall", "fibos", {
            authorization: name1
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner, "fibos");
        assert.deepEqual(r[0].total_staked, {
            "quantity": "230.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].miner_staked, {
            "quantity": "140.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].lps_staked, {
            "quantity": "90.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].current_rate, "0.23000000000000001");
        r[0].lps.forEach(element => {
            delete element.updated_at;
        });
        assert.deepEqual(r[0].lps, [
            {
                "owner": name1,
                "staked": {
                    "quantity": "90.0000 DMC",
                    "contract": "datamall"
                }
            }
        ]);
        chekcpststats(fibos, "fibos", {
            "quantity": "1000 PST",
            "contract": "datamall"
        });
    })

    it(`r < 0.15, liquidation`, () => {
        ctx.redemptionSync(name1, "90.0000 DMC@datamall", "fibos", {
            authorization: name1
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner, "fibos");
        assert.deepEqual(r[0].total_staked, {
            "quantity": "140.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].miner_staked, {
            "quantity": "140.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].lps_staked, {
            "quantity": "0.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].current_rate, "0.14000000000000001");
        r[0].lps.forEach(element => {
            delete element.updated_at;
        });
        chekcpststats(fibos, "fibos", {
            "quantity": "0 PST",
            "contract": "datamall"
        });
        let s = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        assert.deepEqual(s.length, 0)
    })


});

require.main === module && test.run(console.DEBUG);