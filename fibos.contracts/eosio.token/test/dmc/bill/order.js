let test = require('test');
test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let checkaccount = test_util.checkaccount;
const coroutine = require("coroutine")
var users = {};

describe(`order`, () => {
    let contract = "user1"
    let fibos, ctx, name, name1;

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
            test_util.user(fibos, name);
        }
        name1 = test_util.user(fibos);
        ctx = fibos.contractSync("eosio.token");

        ctx.excreateSync("eosio", `1000000000 PST`, `0 PST`, 0, {
            authorization: "eosio"
        })
        ctx.excreateSync("datamall", `1000000000 PST`, `0 PST`, 0, {
            authorization: "datamall"
        })
        ctx.excreateSync("datamall", `1000000000.0000 DMC`, `0.0000 DMC`, 0, {
            authorization: "datamall"
        })
        ctx.excreateSync("datamall", `1000000000.00000000 RSI`, `0.00000000 RSI`, 0, {
            authorization: "datamall"
        })
        ctx.exissueSync("fibos", `1000000 PST@eosio`, `issue 1000000 PST`, {
            authorization: "eosio"
        });
    });
    after(() => {
        test_util.stop()
    })

    let bill_id;
    it(`bill 100 PST, by price 2`, () => {
        ctx.exissueSync("fibos", `150 PST@datamall`, `issue 150 PST`, {
            authorization: "datamall"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "datamall", "stats").rows[2], {
            "supply": "150 PST",
            "max_supply": "1000000000 PST",
            "issuer": "datamall",
            "reserve_supply": "0 PST"
        });
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "150 PST",
            "contract": "datamall"
        });
        ctx.billSync("fibos", "100 PST@datamall", 2, "test", {
            authorization: "fibos"
        });
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "50 PST",
            "contract": "datamall"
        });
        let r = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        assert.deepEqual(r[0].unmatched, {
            "quantity": "100 PST",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].price, "8589934592");
        bill_id = r[0].bill_id;
    })

    it(`invaild asset`, () => {
        assert.throws(() => {
            ctx.orderSync("fibos", "fibos", bill_id, "30 PST@eosio", "test", {
                authorization: "fibos"
            })
        });
    })

    it(`overdrawn balance`, () => {
        assert.throws(() => {
            ctx.orderSync("fibos", "fibos", bill_id, "30 PST@datamall", "test", {
                authorization: "fibos"
            })
        });
    })

    it(`no such record`, () => {
        assert.throws(() => {
            ctx.orderSync("fibos", "fibos", 1, "30 PST@datamall", "test", {
                authorization: "fibos"
            })
        });
    })

    it(`order with self`, () => {
        ctx.exissueSync("fibos", `100000.0000 DMC@datamall`, `issue 100000 DMC`, {
            authorization: "datamall"
        });
        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "100000.0000 DMC",
            "contract": "datamall"
        });
        coroutine.sleep(2 * 1000);
        ctx.orderSync("fibos", "fibos", bill_id, "30 PST@datamall", "test", {
            authorization: "fibos"
        })
        let s = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        assert.deepEqual(s[0].unmatched, {
            "quantity": "70 PST",
            "contract": "datamall"
        });
        assert.deepEqual(s[0].matched, {
            "quantity": "30 PST",
            "contract": "datamall"
        });
        let o = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcorder").rows;
        assert.deepEqual(o[0].miner, "fibos");
        assert.deepEqual(o[0].user, "fibos");
        assert.deepEqual(o[0].user_pledge, {
            "quantity": "60.0000 DMC",
            "contract": "datamall"
        })
        assert.deepEqual(o[0].miner_pledge, {
            "quantity": "30 PST",
            "contract": "datamall"
        })
        assert.deepEqual(o[0].state, 1)
        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "99940.0000 DMC",
            "contract": "datamall"
        });
    })

    it(`order with eosio`, () => {
        ctx.exissueSync("eosio", `100000.0000 DMC@datamall`, `issue 100000 DMC`, {
            authorization: "datamall"
        });
        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "99940.0000 DMC",
            "contract": "datamall"
        });
        checkaccount(fibos, "eosio", "DMC", "datamall", {
            "quantity": "100000.0000 DMC",
            "contract": "datamall"
        });
        coroutine.sleep(2 * 1000);
        ctx.orderSync("eosio", "fibos", bill_id, "30 PST@datamall", "test", {
            authorization: "eosio"
        })
        let s = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        assert.deepEqual(s[0].unmatched, {
            "quantity": "40 PST",
            "contract": "datamall"
        });
        assert.deepEqual(s[0].matched, {
            "quantity": "60 PST",
            "contract": "datamall"
        });
        let o = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcorder").rows;
        assert.deepEqual(o[1].miner, "fibos");
        assert.deepEqual(o[1].user, "eosio");
        assert.deepEqual(o[1].user_pledge, {
            "quantity": "60.0000 DMC",
            "contract": "datamall"
        })
        assert.deepEqual(o[1].miner_pledge, {
            "quantity": "30 PST",
            "contract": "datamall"
        })
        assert.deepEqual(o[1].state, 1)
        checkaccount(fibos, "eosio", "DMC", "datamall", {
            "quantity": "99940.0000 DMC",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "99940.0000 DMC",
            "contract": "datamall"
        });
    })


    it(`fibos bill by price 2.1`, () => {
        ctx.billSync("fibos", "20 PST@datamall", 2.1, "test", {
            authorization: "fibos"
        });
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "30 PST",
            "contract": "datamall"
        });
        let r = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        assert.deepEqual(r[1].unmatched, {
            "quantity": "20 PST",
            "contract": "datamall"
        });
        assert.deepEqual(r[1].price, "9019431321");
        bill_id = r[1].bill_id;
    })

    it(`order with eosio`, () => {
        coroutine.sleep(2 * 1000);
        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "99940.0000 DMC",
            "contract": "datamall"
        });
        ctx.orderSync("eosio", "fibos", bill_id, "10 PST@datamall", "test", {
            authorization: "eosio"
        })
        let s = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        assert.deepEqual(s[1].unmatched, {
            "quantity": "10 PST",
            "contract": "datamall"
        });
        assert.deepEqual(s[1].matched, {
            "quantity": "10 PST",
            "contract": "datamall"
        });
        let o = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcorder").rows;
        assert.deepEqual(o[2].miner, "fibos");
        assert.deepEqual(o[2].user, "eosio");
        assert.deepEqual(o[2].user_pledge, {
            "quantity": "21.0000 DMC",
            "contract": "datamall"
        })
        assert.deepEqual(o[2].miner_pledge, {
            "quantity": "10 PST",
            "contract": "datamall"
        })
        assert.deepEqual(o[2].state, 1)
        checkaccount(fibos, "eosio", "DMC", "datamall", {
            "quantity": "99919.0000 DMC",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "99940.0000 DMC",
            "contract": "datamall"
        });
    })

    it(`order with ${name1}`, () => {
        coroutine.sleep(2 * 1000);
        ctx.exissueSync(name1, `100000.0000 DMC@datamall`, `issue 100000 DMC`, {
            authorization: "datamall"
        });

        ctx.orderSync(name1, "fibos", bill_id, "5 PST@datamall", "test", {
            authorization: name1
        })
        let s = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        assert.deepEqual(s[1].unmatched, {
            "quantity": "5 PST",
            "contract": "datamall"
        });
        assert.deepEqual(s[1].matched, {
            "quantity": "15 PST",
            "contract": "datamall"
        });
        let o = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcorder").rows;
        assert.deepEqual(o[3].miner, "fibos");
        assert.deepEqual(o[3].user, name1);
        assert.deepEqual(o[3].user_pledge, {
            "quantity": "10.5000 DMC",
            "contract": "datamall"
        })
        assert.deepEqual(o[3].miner_pledge, {
            "quantity": "5 PST",
            "contract": "datamall"
        })
        assert.deepEqual(o[3].state, 1)
        checkaccount(fibos, "eosio", "DMC", "datamall", {
            "quantity": "99919.0000 DMC",
            "contract": "datamall"
        });
    })

    it(`unbill`, () => {
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "30 PST",
            "contract": "datamall"
        });
        let s = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        assert.deepEqual(s[1].unmatched, {
            "quantity": "5 PST",
            "contract": "datamall"
        });
        ctx.unbillSync("fibos", bill_id, "test", {
            authorization: "fibos"
        })
        s = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        assert.deepEqual(s[1], undefined);
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "35 PST",
            "contract": "datamall"
        });
    })

    it(`match all pst rows[0]`, () => {
        let s = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        bill_id = s[0].bill_id;
        assert.deepEqual(s[0].unmatched, {
            "quantity": "40 PST",
            "contract": "datamall"
        });
        ctx.orderSync("eosio", "fibos", bill_id, "40 PST@datamall", "test", {
            authorization: "eosio"
        })
        s = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        assert.deepEqual(s[0].unmatched, {
            "quantity": "0 PST",
            "contract": "datamall"
        });
    })

    it(`unbill row[0]`, () => {
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "35 PST",
            "contract": "datamall"
        });
        ctx.unbillSync("fibos", bill_id, "test", {
            authorization: "fibos"
        })
        s = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        assert.deepEqual(s[0], undefined);
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "35 PST",
            "contract": "datamall"
        });
    })
});

require.main === module && test.run(console.DEBUG);