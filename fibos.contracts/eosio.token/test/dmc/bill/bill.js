let test = require('test');
test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let checkaccount = test_util.checkaccount;
const coroutine = require("coroutine")
var users = {};

describe(`bill`, () => {
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

    it(`error, bill PST@eosio`, () => {
        assert.throws(() => {
            ctx.billSync("fibos", "100 PST@eosio", 1, "test", {
                authorization: "fibos"
            })
        });
    })

    it(`error, bill PST@datamall, no balance object found`, () => {
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "datamall", "stats").rows[1], {
            "supply": "0 PST",
            "max_supply": "1000000000 PST",
            "issuer": "datamall",
            "reserve_supply": "0 PST"
        });
        checkaccount(fibos, "fibos", "PST", "datamall", null);
        assert.throws(() => {
            ctx.billSync("fibos", "100 PST@datamall", 0, "test", {
                authorization: "fibos"
            });
        });
    })

    it(`error, invaild price (-1)`, () => {
        assert.throws(() => {
            ctx.billSync("fibos", "100 PST@datamall", -1, "test", {
                authorization: "fibos"
            });
        });
    })

    it(`error, invaild price (0)`, () => {
        assert.throws(() => {
            ctx.billSync("fibos", "100 PST@datamall", 0, "test", {
                authorization: "fibos"
            });
        });
    })

    it(`error, invaild price (0.00009)`, () => {
        assert.throws(() => {
            ctx.billSync("fibos", "100 PST@datamall", 0.00009, "test", {
                authorization: "fibos"
            });
        });
    })

    it(`error, bill PST@datamall, overdrawn balance`, () => {
        ctx.exissueSync("fibos", `50 PST@datamall`, `issue 50 PST`, {
            authorization: "datamall"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "datamall", "stats").rows[1], {
            "supply": "50 PST",
            "max_supply": "1000000000 PST",
            "issuer": "datamall",
            "reserve_supply": "0 PST"
        });
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "50 PST",
            "contract": "datamall"
        });
        assert.throws(() => {
            ctx.billSync("fibos", "100 PST@datamall", 0, "test", {
                authorization: "fibos"
            });
        });
    })

    it(`success, bill 100 PST`, () => {
        ctx.exissueSync("fibos", `100 PST@datamall`, `issue 50 PST`, {
            authorization: "datamall"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "datamall", "stats").rows[1], {
            "supply": "150 PST",
            "max_supply": "1000000000 PST",
            "issuer": "datamall",
            "reserve_supply": "0 PST"
        });
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "150 PST",
            "contract": "datamall"
        });
        ctx.billSync("fibos", "100 PST@datamall", 1, "test", {
            authorization: "fibos"
        });
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "50 PST",
            "contract": "datamall"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows[0].unmatched, {
            "quantity": "100 PST",
            "contract": "datamall"
        });
    })

    it(`error, unbill no such record`, () => {
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "datamall", "stakerec").rows, []);
        assert.throws(() => {
            ctx.unbillSync("datamall", 0, "test", {
                authorization: "datamall"
            });
        });
    })

    it(`error, unbill no such primary`, () => {
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows.length, 1);
        assert.throws(() => {
            ctx.unbillSync("fibos", 2, "test", {
                authorization: "fibos"
            });
        });
    })

    it(`succcess, unbill primary 1`, () => {
        let tb = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        assert.deepEqual(tb.length, 1);
        let bill_id = tb[0].bill_id;
        coroutine.sleep(1000)
        ctx.unbillSync("fibos", bill_id, "test", {
            authorization: "fibos"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows.length, 0);
    })

    it(`multiple bill`, () => {
        ctx.exissueSync("fibos", `1000 PST@datamall`, `issue 50 PST`, {
            authorization: "datamall"
        });
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "1150 PST",
            "contract": "datamall"
        });
        for (var i = 0; i <= 3; i++) {
            let amount = 50 + i;
            coroutine.sleep(1000);
            ctx.billSync("fibos", `${amount} PST@datamall`, 1, `test ${amount}`, {
                authorization: "fibos"
            });
        }
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "944 PST",
            "contract": "datamall"
        });
    })

    it(`multiple unbill`, () => {
        coroutine.sleep(2000)
        let tb = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        for (var i = 0; i <= tb.length - 1; i++) {
            let bill_id = tb[i].bill_id;
            ctx.unbillSync("fibos", bill_id, `test ${bill_id}`, {
                authorization: "fibos"
            });
        }
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "1150 PST",
            "contract": "datamall"
        });
    })

    it(`stack price more than 2^32`, () => {
        assert.throws(() => {
            ctx.billSync("fibos", "50 PST@datamall", Math.pow(2, 32), "test", {
                authorization: "fibos"
            });
        });
    })

    it(`stack price less than 2^32`, () => {
        ctx.billSync("fibos", "50 PST@datamall", Math.pow(2, 32) - 1, "test", {
            authorization: "fibos"
        });
    })
});

require.main === module && test.run(console.DEBUG);