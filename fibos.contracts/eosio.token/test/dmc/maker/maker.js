let test = require('test');
test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let checkaccount = test_util.checkaccount;
let checkmakerstats = test_util.checkmakerstats;
let checkmakerpool = test_util.checkmakerpool;
let chekcpststats = test_util.chekcpststats;
const coroutine = require("coroutine")
var users = {};

describe(`maker`, () => {
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
        test_util.stop()
    })

    it(`error, using DMC@eosio to maker`, () => {
        assert.throws(() => {
            ctx.increaseSync("fibos", "1.0000 DMC@eosio", "fibos", {
                authorization: "fibos"
            })
        });
    })

    it(`overdrawn balance`, () => {
        assert.throws(() => {
            ctx.increaseSync("fibos", "1.0000 DMC@datamall", "fibos", {
                authorization: "fibos"
            })
        });
    })

    it(`maker`, () => {
        ctx.exissueSync("fibos", `1000.0000 DMC@datamall`, `issue 1000 DMC`, {
            authorization: "datamall"
        });
        ctx.increaseSync("fibos", "1.0000 DMC@datamall", "fibos", {
            authorization: "fibos"
        })
        checkmakerstats(fibos, "fibos", {
            "miner": "fibos",
            "current_rate": "18446744073709551616.00000000000000000",
            "miner_rate": "1.00000000000000000",
            "total_weight": "10000.00000000000000000",
            "total_staked": {
                "quantity": "1.0000 DMC",
                "contract": "datamall"
            }
        })
        checkmakerpool(fibos, "fibos", "fibos", {
            "onwer": "fibos",
            "weight": "10000.00000000000000000"
        });
    })

    it(`maker, invaild asset`, () => {
        assert.throws(() => {
            ctx.increaseSync("fibos", "-1.0000 DMC@datamall", "fibos", {
                authorization: "fibos"
            })
        });
    });

    it(`increase maker, no such record`, () => {
        assert.throws(() => {
            ctx.increaseSync("fibos", "1.0000 DMC@datamall", "name1", {
                authorization: "fibos"
            })
        });
    })

    it(`miner increase, invaild asset`, () => {
        assert.throws(() => {
            ctx.increaseSync("fibos", "-1.0000 DMC@datamall", "fibos", {
                authorization: "fibos"
            })
        });
    })

    it(`miner increase`, () => {
        ctx.increaseSync("fibos", "1.0000 DMC@datamall", "fibos", {
            authorization: "fibos"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        checkmakerstats(fibos, "fibos", {
            "miner": "fibos",
            "current_rate": "18446744073709551616.00000000000000000",
            "miner_rate": "1.00000000000000000",
            "total_weight": "20000.00000000000000000",
            "total_staked": {
                "quantity": "2.0000 DMC",
                "contract": "datamall"
            }
        })
        checkmakerpool(fibos, "fibos", "fibos", {
            "onwer": "fibos",
            "weight": "20000.00000000000000000"
        });
        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "998.0000 DMC",
            "contract": "datamall"
        })
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

    it(`lp increase`, () => {
        ctx.exissueSync(name1, `1000.0000 DMC@datamall`, `issue 1000 DMC`, {
            authorization: "datamall"
        });
        ctx.increaseSync(name1, "1.0000 DMC@datamall", "fibos", {
            authorization: name1
        })
        checkmakerstats(fibos, "fibos", {
            "miner": "fibos",
            "current_rate": "18446744073709551616.00000000000000000",
            "miner_rate": "0.20000000000000001",
            "total_weight": "30000.00000000000000000",
            "total_staked": {
                "quantity": "3.0000 DMC",
                "contract": "datamall"
            }
        })
        checkmakerpool(fibos, "fibos", "fibos", {
            "onwer": "fibos",
            "weight": "20000.00000000000000000"
        });
        checkmakerpool(fibos, name1, "fibos", {
            "onwer": name1,
            "weight": "10000.00000000000000000"
        });
        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "998.0000 DMC",
            "contract": "datamall"
        })
        checkaccount(fibos, name1, "DMC", "datamall", {
            "quantity": "999.0000 DMC",
            "contract": "datamall"
        })
    })

    it(`lp re-increase`, () => {
        coroutine.sleep(1000);
        ctx.increaseSync(name1, "1.0000 DMC@datamall", "fibos", {
            authorization: name1
        })
        checkmakerstats(fibos, "fibos", {
            "miner": "fibos",
            "current_rate": "18446744073709551616.00000000000000000",
            "miner_rate": "0.20000000000000001",
            "total_weight": "40000.00000000000000000",
            "total_staked": {
                "quantity": "4.0000 DMC",
                "contract": "datamall"
            }
        })
        checkmakerpool(fibos, "fibos", "fibos", {
            "onwer": "fibos",
            "weight": "20000.00000000000000000"
        });
        checkmakerpool(fibos, name1, "fibos", {
            "onwer": name1,
            "weight": "20000.00000000000000000"
        });
        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "998.0000 DMC",
            "contract": "datamall"
        })
        checkaccount(fibos, name1, "DMC", "datamall", {
            "quantity": "998.0000 DMC",
            "contract": "datamall"
        })
    })

    it(`lp increase, invaild asset`, () => {
        assert.throws(() => {
            ctx.increaseSync(name1, "-1.0000 DMC@datamall", "fibos", {
                authorization: name1
            })
        });
    })

    it(`another lp increase`, () => {
        ctx.exissueSync(name2, `1000.0000 DMC@datamall`, `issue 1000 DMC`, {
            authorization: "datamall"
        });
        ctx.increaseSync(name2, "1.0000 DMC@datamall", "fibos", {
            authorization: name2
        })
        checkmakerstats(fibos, "fibos", {
            "miner": "fibos",
            "current_rate": "18446744073709551616.00000000000000000",
            "miner_rate": "0.20000000000000001",
            "total_weight": "50000.00000000000000000",
            "total_staked": {
                "quantity": "5.0000 DMC",
                "contract": "datamall"
            }
        })
        checkmakerpool(fibos, "fibos", "fibos", {
            "onwer": "fibos",
            "weight": "20000.00000000000000000"
        });
        checkmakerpool(fibos, name1, "fibos", {
            "onwer": name1,
            "weight": "20000.00000000000000000"
        });
        checkmakerpool(fibos, name2, "fibos", {
            "onwer": name2,
            "weight": "10000.00000000000000000"
        });
        checkaccount(fibos, name2, "DMC", "datamall", {
            "quantity": "999.0000 DMC",
            "contract": "datamall"
        })
    })

    it(`another lp increase, check weights`, () => {
        ctx.increaseSync(name2, "1.2345 DMC@datamall", "fibos", {
            authorization: name2
        })
        checkmakerstats(fibos, "fibos", {
            "miner": "fibos",
            "current_rate": "18446744073709551616.00000000000000000",
            "miner_rate": "0.20000000000000001",
            "total_weight": "62345.00000000000000000",
            "total_staked": {
                "quantity": "6.2345 DMC",
                "contract": "datamall"
            }
        })
        checkmakerpool(fibos, "fibos", "fibos", {
            "onwer": "fibos",
            "weight": "20000.00000000000000000"
        });
        checkmakerpool(fibos, name1, "fibos", {
            "onwer": name1,
            "weight": "20000.00000000000000000"
        });
        checkmakerpool(fibos, name2, "fibos", {
            "onwer": name2,
            "weight": "22345.00000000000000000"
        });
        checkaccount(fibos, name2, "DMC", "datamall", {
            "quantity": "997.7655 DMC",
            "contract": "datamall"
        })
    })

    it(`miner redemption, invaild rate`, () => {
        assert.throws(() => {
            ctx.redemptionSync("fibos", -1, "fibos", {
                authorization: "fibos"
            })
        });
        assert.throws(() => {
            ctx.redemptionSync("fibos", 0, "fibos", {
                authorization: "fibos"
            })
        });
        assert.throws(() => {
            ctx.redemptionSync("fibos", 1.2, "fibos", {
                authorization: "fibos"
            })
        });
    })

    it(`redemption, no such record`, () => {
        assert.throws(() => {
            ctx.redemptionSync("fibos", 1, "name1", {
                authorization: "fibos"
            })
        });
    })

    it(`bill and order`, () => {
        ctx.exissueSync(name1, `1000 PST@datamall`, `issue 1000 PST`, {
            authorization: "datamall"
        });
        ctx.billSync(name1, "100 PST@datamall", 0.011, "test", {
            authorization: name1
        });
        let s = fibos.getTableRowsSync(true, "eosio.token", name1, "stakerec").rows;
        let bill_id = s[0].bill_id;
        ctx.orderSync(name1, name1, bill_id, "5 PST@datamall", "test", {
            authorization: name1
        })
        let p = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcprice").rows;
        price = p[0].price;
        assert.deepEqual(price, "0.01099999994039536");
        chekcpststats(fibos, name1, {
            "quantity": "1000 PST",
            "contract": "datamall"
        });
    })

    it(`miner redemption`, () => {
        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "998.0000 DMC",
            "contract": "datamall"
        })
        chekcpststats(fibos, "fibos", null);
        ctx.redemptionSync("fibos", 0.3, "fibos", {
            authorization: "fibos"
        })
        checkmakerstats(fibos, "fibos", {
            "miner": "fibos",
            "current_rate": "18446744073709551616.00000000000000000",
            "miner_rate": "0.20000000000000001",
            "total_weight": "56345.00000000000000000",
            "total_staked": {
                "quantity": "5.6345 DMC",
                "contract": "datamall"
            }
        })
        checkmakerpool(fibos, "fibos", "fibos", {
            "onwer": "fibos",
            "weight": "14000.00000000000000000"
        });
        checkmakerpool(fibos, name1, "fibos", {
            "onwer": name1,
            "weight": "20000.00000000000000000"
        });
        checkmakerpool(fibos, name2, "fibos", {
            "onwer": name2,
            "weight": "22345.00000000000000000"
        });

        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "998.6000 DMC",
            "contract": "datamall"
        })
    })

    it(`miner redemption, below the minimum rate`, () => {
        assert.throws(() => {
            ctx.redemptionSync("fibos", 0.5, "fibos", {
                authorization: "fibos"
            })
        });
    })

    it(`lp redemption 0.3 rate`, () => {
        checkaccount(fibos, name1, "DMC", "datamall", {
            "quantity": "997.9450 DMC",
            "contract": "datamall"
        })
        ctx.redemptionSync(name1, 0.3, "fibos", {
            authorization: name1
        })
        checkmakerstats(fibos, "fibos", {
            "miner": "fibos",
            "current_rate": "18446744073709551616.00000000000000000",
            "miner_rate": "0.20000000000000001",
            "total_weight": "50345.00000000000000000",
            "total_staked": {
                "quantity": "5.0345 DMC",
                "contract": "datamall"
            }
        })
        checkmakerpool(fibos, "fibos", "fibos", {
            "onwer": "fibos",
            "weight": "14000.00000000000000000"
        });
        checkmakerpool(fibos, name1, "fibos", {
            "onwer": name1,
            "weight": "14000.00000000000000000"
        });
        checkmakerpool(fibos, name2, "fibos", {
            "onwer": name2,
            "weight": "22345.00000000000000000"
        });
        checkaccount(fibos, name1, "DMC", "datamall", {
            "quantity": "998.5450 DMC",
            "contract": "datamall"
        })
    })

    it(`lp re-redemption 1 rate`, () => {
        checkaccount(fibos, name1, "DMC", "datamall", {
            "quantity": "998.5450 DMC",
            "contract": "datamall"
        })
        coroutine.sleep(1000);
        ctx.redemptionSync(name1, 1, "fibos", {
            authorization: name1
        })
        checkmakerstats(fibos, "fibos", {
            "miner": "fibos",
            "current_rate": "18446744073709551616.00000000000000000",
            "miner_rate": "0.20000000000000001",
            "total_weight": "36345.00000000000000000",
            "total_staked": {
                "quantity": "3.6345 DMC",
                "contract": "datamall"
            }
        })
        checkmakerpool(fibos, "fibos", "fibos", {
            "onwer": "fibos",
            "weight": "14000.00000000000000000"
        });
        checkmakerpool(fibos, name1, "fibos", null);
        checkmakerpool(fibos, name2, "fibos", {
            "onwer": name2,
            "weight": "22345.00000000000000000"
        });
        checkaccount(fibos, name1, "DMC", "datamall", {
            "quantity": "999.9450 DMC",
            "contract": "datamall"
        })
    })

    it(`lp re-redemption, no such limit partnership`, () => {
        checkaccount(fibos, name1, "DMC", "datamall", {
            "quantity": "999.9450 DMC",
            "contract": "datamall"
        })
        assert.throws(() => {
            ctx.redemptionSync(name1, "1.0000 DMC@datamall", "fibos", {
                authorization: name1
            })
        });
    })

    it(`another lp redemption`, () => {
        checkaccount(fibos, name2, "DMC", "datamall", {
            "quantity": "997.7655 DMC",
            "contract": "datamall"
        })
        ctx.redemptionSync(name2, 1, "fibos", {
            authorization: name2
        })

        checkmakerstats(fibos, "fibos", {
            "miner": "fibos",
            "current_rate": "18446744073709551616.00000000000000000",
            "miner_rate": "0.20000000000000001",
            "total_weight": "14000.00000000000000000",
            "total_staked": {
                "quantity": "1.4000 DMC",
                "contract": "datamall"
            }
        })
        checkmakerpool(fibos, "fibos", "fibos", {
            "onwer": "fibos",
            "weight": "14000.00000000000000000"
        });
        checkmakerpool(fibos, name1, "fibos", null);
        checkmakerpool(fibos, name2, "fibos", null);
        checkaccount(fibos, name2, "DMC", "datamall", {
            "quantity": "1000.0000 DMC",
            "contract": "datamall"
        })
    })

    it(`miner can not redemption when lp satekd in excess of maximum rate `, () => {
        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "998.6000 DMC",
            "contract": "datamall"
        })
        assert.throws(() => {
            ctx.redemptionSync("fibos", 1, "fibos", {
                authorization: "fibos"
            })
        });
    })

    it(`set rate to 1.0`, () => {
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner_rate, "0.20000000000000001");
        ctx.setmakerrateSync("fibos", 1, {
            authorization: "fibos"
        })
        r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner_rate, "1.00000000000000000");
    })

    it(`lp can not increase when lp satekd in excess of maximum rate`, () => {
        assert.throws(() => {
            ctx.increaseSync(name1, "1.0000 DMC@datamall", "fibos", {
                authorization: name1
            })
        });
    })
});

require.main === module && test.run(console.DEBUG);