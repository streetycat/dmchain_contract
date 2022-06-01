let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let checkaccount = test_util.checkaccount;
let fmtDate = test_util.fmtDate;
let checkunswapmarket = test_util.checkunswapmarket;
let checkmarketpool = test_util.checkmarketpool;
let now;
var users = {};

describe(`inverse order`, () => {
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
        let transfer_amount = "10000.0000";
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

    it(`create market`, () => {
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9990000.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "990000.0000 FO",
            "contract": "eosio"
        });
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
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9980000.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "989000.0000 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "10000.00000000000000000"
        });
    });

    it(`使用fibos来进行限价交易，以10的价格卖1000个EOS ,直接挂单`, () => {
        let r = ctx.exchangeSync("fibos", "1000.0000 FO@eosio", "0.0000 EOS@eosio", 1 / 11, "test", "memo", {
            authorization: "fibos"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder"), {
            "rows": [],
            "more": false
        })
        let bid_id = fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder").rows[0].bid_id;
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder"), {
            "rows": [
                {
                    "bid_id": bid_id,
                    "owner": "fibos",
                    "price": "47244640256",
                    "quantity": {
                        "quantity": "11000.0000 EOS",
                        "contract": "eosio"
                    },
                    "filled": {
                        "quantity": "1000.0000 FO",
                        "contract": "eosio"
                    }
                }
            ],
            "more": false
        })
    });

    it(`使用name来进行限价交易，以5的价格卖100个FO,由于价格低于订单价格,不应该撮合,直接挂单 `, () => {
        ctx.exchangeSync(name, "0.0000 EOS@eosio", "100.0000 FO@eosio", 5, "test2", "memo2", {
            authorization: name
        });

        let bid_id = fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder").rows[0].bid_id;
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder"), {
            "rows": [
                {
                    "bid_id": bid_id,
                    "owner": "user1",
                    "price": 858993459,
                    "quantity": {
                        "quantity": "100.0000 FO",
                        "contract": "eosio"
                    },
                    "filled": {
                        "quantity": "500.0000 EOS",
                        "contract": "eosio"
                    }
                }
            ],
            "more": false
        })
        bid_id = fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder").rows[0].bid_id;
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder"), {
            "rows": [
                {
                    "bid_id": bid_id,
                    "owner": "fibos",
                    "price": "47244640256",
                    "quantity": {
                        "quantity": "11000.0000 EOS",
                        "contract": "eosio"
                    },
                    "filled": {
                        "quantity": "1000.0000 FO",
                        "contract": "eosio"
                    }
                }
            ],
            "more": false
        })
    });
});

require.main === module && test.run(console.DEBUG);