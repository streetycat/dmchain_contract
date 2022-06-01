let test = require('test');
test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let checkaccount = test_util.checkaccount;
let checkunswapmarket = test_util.checkunswapmarket;
var users = {};

describe(`market pass`, () => {
    let symbol = "AAA";
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

        ctx.createSync("datamall", "50000000.0000 EOS", {
            authorization: "datamall"
        });
        ctx.excreateSync("datamall", `10000000.0000 FO`, `0.0000 FO`, 0, {
            authorization: "datamall"
        });
        ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
            authorization: "datamall"
        });
        ctx.issueSync("fibos", `1000000.0000 FO`, `issue 100.0000 FO`, {
            authorization: "datamall"
        });
        let transfer_amount = "100.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@datamall`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
    });

    it(`create market`, () => {
        ctx.addreservesSync("fibos", "1000.0000 EOS@datamall", "1000.0000 FO@datamall", {
            authorization: "fibos"
        });
    });

    it(`exchange 200 `, () => {
        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "9999000.0000 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "998900.0000 FO",
            "contract": "datamall"
        })
        let r = ctx.exchangeSync("fibos", "200.0000 EOS@datamall", "0.0000 FO@datamall", 0, "test", {
            authorization: "fibos"
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "owner": "fibos",
            "oppo": "eosio",
            "from": {
                "quantity": "200.0000 EOS",
                "contract": "datamall"
            },
            "to": {
                "quantity": "166.1666 FO",
                "contract": "datamall"
            },
            "fee": {
                "quantity": "0.5001 FO",
                "contract": "datamall"
            },
            "bid_id": 0
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "1200.0000 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "833.8334 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })
        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "9998800.0000 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "999066.1666 FO",
            "contract": "datamall"
        })
    })

    it(`exchange 1.5550`, () => {
        let r = ctx.exchangeSync("fibos", "1.5550 EOS@datamall", "0.0000 FO@datamall", 0, "test", {
            authorization: "fibos"
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "owner": "fibos",
            "oppo": "eosio",
            "from": {
                "quantity": "1.5550 EOS",
                "contract": "datamall"
            },
            "to": {
                "quantity": "1.0758 FO",
                "contract": "datamall"
            },
            "fee": {
                "quantity": "0.0033 FO",
                "contract": "datamall"
            },
            "bid_id": 0
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "1201.5550 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "832.7576 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })
        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "9998798.4450 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "999067.2424 FO",
            "contract": "datamall"
        })
    })

    it(`exchange 100000`, () => {
        ctx.exchangeSync("fibos", "100000.0000 EOS@datamall", "0.0000 FO@datamall", 0, `test`, `test`, {
            authorization: "fibos"
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "101201.5550 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "12.3559 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        });
    })

    it(`exchange 1000000`, () => {
        ctx.exchangeSync("fibos", "1000000.0000 EOS@datamall", "0.0000 FO@datamall", 0, `test`, `test`, {
            authorization: "fibos"
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "1101201.5550 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "1.1692 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        });
    })
});

require.main === module && test.run(console.DEBUG);