let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let checkaccount = test_util.checkaccount;
let fmtDate = test_util.fmtDate;
let parseDate = test_util.parseDate;
let checkunswapmarket = test_util.checkunswapmarket;
let checkmarketpool = test_util.checkmarketpool;
let checkmarketorder = test_util.checkmarketorder;
let now;
const coroutine = require('coroutine');
var users = {};

describe(`reserves lock`, () => {
    let symbol = "AAA";
    let contract = "user1"
    let fibos, ctx, name, name1;
    let precision = 4;

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
            test_util.user(fibos, name);
        }
        name1 = test_util.user(fibos);
        ctx = fibos.contractSync("eosio.token");

        ctx.createSync("eosio", "50000000.0000 EOS", {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.excreateSync("eosio", `10000000.0000 FO`, 0, `10000000.0000 FO`, `100.0000 FO`, `10000.0000 EOS`, 0, 0, 0, 'eosio', {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
            authorization: "eosio"
        });
        ctx.issueSync("fibos", `1000000.0000 FO`, `issue 100.0000 FO`, {
            authorization: "eosio"
        });
        let transfer_amount = "100.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        ctx.extransferSync("fibos", name, `${transfer_amount} EOS@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        now = fmtDate();
        ctx.excreateSync(name, fmt(100000000000, precision, symbol), 0, fmt(100000000000, precision, symbol), fmt(300000000, precision, symbol), fmt(1000000, 4, "FO"), now, 0, 0, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
            authorization: name
        });

        ctx.exissueSync(name, `1000000.0000 AAA@${name}`, `issue 1000000.0000 AAA`, {
            authorization: name
        });
    });

    it(`no such market should throw`, () => {
        assert.throws(() => {
            ctx.lockreserveSync("fibos", "0.0000 EOS@eosio", "0.0000 FO@eosio", {
                authorization: "fibos"
            });
        });
    })

    it(`create market`, () => {
        ctx.addreservesSync("fibos", "10000.0000 EOS@eosio", "1000.0000 FO@eosio", {
            authorization: "fibos"
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10000.0000 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1000.0000 FO",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })
    })

    it(`no add but lock throw`, () => {
        assert.throws(() => {
            ctx.lockreserveSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", {
                authorization: name
            });
        });
    })

    it(`user1 addreserves`, () => {
        ctx.addreservesSync(name, "10.0000 EOS@eosio", "10.0000 FO@eosio", {
            authorization: name
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10010.0000 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1010.0000 FO",
                "contract": "eosio"
            },
            "total_weights": "10054.89930332472431473"
        })
    })

    it(`not lock can out`, () => {
        ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", 0.5, {
            authorization: name
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "9982.7003 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1007.2455 FO",
                "contract": "eosio"
            },
            "total_weights": "10027.44965166236215737"
        })
    })

    it(`add and Lock`, () => {
        ctx.lockreserveSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", {
            authorization: name
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaplock"), {
            "rows": [
                {
                    "owner": "user1",
                    "request_time": "1970-01-01T00:00:00"
                }
            ],
            "more": false
        });
    })

    it(`locked cannot out`, () => {
        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", 0.5, {
                authorization: name
            });
        });
    })

    it(`locked can add`, () => {
        ctx.addreservesSync(name, "10.0000 FO@eosio", "10.0000 EOS@eosio", {
            authorization: name
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "9992.7003 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1017.2455 FO",
                "contract": "eosio"
            },
            "total_weights": "10082.14932673471230373"
        })
    })

    it(`unlock`, () => {
        ctx.unlckreserveSync(name, "0.0000 FO@eosio", "0.0000 EOS@eosio", {
            authorization: name
        });
        assert.notEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaplock").rows[0].request_time, parseDate(0));
    })

    it(`Can't out before time limit`, () => {
        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", 0.5, {
                authorization: name
            });
        });
    })

    it(`reunlock`, () => {
        assert.throws(() => {
            ctx.unlckreserveSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", {
                authorization: name
            });
        });
    });

    it(`relock`, () => {
        ctx.lockreserveSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", {
            authorization: name
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaplock").rows[0].request_time, parseDate(0));
    })


    xit(`unlock and can out after time limit`, () => {
        ctx.unlckreserveSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", {
            authorization: name
        });
        assert.notEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaplock").rows[0].request_time, parseDate(0));
        coroutine.sleep(3000);
        ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", 0.5, {
            authorization: name
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "9952.0308 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1013.1054 FO",
                "contract": "eosio"
            },
            "total_weights": "10041.07466336735524237"
        })
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaplock"), {
            "rows": [],
            "more": false
        });
    })
});

require.main === module && test.run(console.DEBUG);