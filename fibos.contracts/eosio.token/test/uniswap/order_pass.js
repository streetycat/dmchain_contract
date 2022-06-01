let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let checkaccount = test_util.checkaccount;
let checkunswapmarket = test_util.checkunswapmarket;
let checkmarketpool = test_util.checkmarketpool;
let checkmarketorder = test_util.checkmarketorder;
var users = {};

describe(`order to pass`, () => {
    let symbol = "AAA";
    let contract = "user1"
    let fibos, ctx, name, name1;
    let bid_id;

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
    });

    it(`invaild order type`, () => {
        assert.throws(() => {
            ctx.exchangeSync("fibos", "10.0000 FO@eosio", "100.0000 EOS@eosio", 0.1, "test", {
                authorization: "fibos"
            });
        });
        assert.throws(() => {
            ctx.exchangeSync("fibos", "0.0000 FO@eosio", "100.0000 EOS@eosio", 0, "test", {
                authorization: "fibos"
            });
        });
        assert.throws(() => {
            ctx.exchangeSync("fibos", "100.0000 FO@eosio", "0.0000 EOS@eosio", 0.1, "test", {
                authorization: "fibos"
            });
        });
        assert.throws(() => {
            ctx.exchangeSync("fibos", "0.0000 FO@eosio", "0.0000 EOS@eosio", 0.1, "test", {
                authorization: "fibos"
            });
        });
        assert.throws(() => {
            ctx.exchangeSync("fibos", "0.0000 FO@eosio", "0.0000 EOS@eosio", 0, "test", {
                authorization: "fibos"
            });
        });
    });

    it(`market dose not exist`, () => {
        assert.throws(() => {
            ctx.exchangeSync("fibos", "10.0000 FO@eosio", "0.0000 EOS@eosio", 0, "test", {
                authorization: "fibos"
            });
        });
        assert.throws(() => {
            ctx.exchangeSync("fibos", "0.0000 FO@eosio", "100.0000 EOS@eosio", 0.1, "test", {
                authorization: "fibos"
            });
        });
    })

    it(`create market`, () => {
        ctx.addreservesSync("fibos", "100.0000 EOS@eosio", "1000.0000 FO@eosio", {
            authorization: "fibos"
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "100.0000 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1000.0000 FO",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "10000.00000000000000000"
        });
    });

    it(`invaild price`, () => {
        assert.throws(() => {
            ctx.exchangeSync("fibos", "0.0000 FO@eosio", "100.0000 EOS@eosio", 999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999.99999, "test", {
                authorization: "fibos"
            });
        });
        assert.throws(() => {
            ctx.exchangeSync("fibos", "0.0000 FO@eosio", "100.0000 EOS@eosio", -1, "test", {
                authorization: "fibos"
            });
        });
    })

    it(`bid order with market price `, () => {
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9999900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "998900.0000 FO",
            "contract": "eosio"
        })
        let r = ctx.exchangeSync("fibos", "0.0000 FO@eosio", "20.0000 EOS@eosio", 10, "test", {
            authorization: "fibos"
        });
        bid_id = fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder").rows[0].bid_id;
        assert.deepEqual(r.processed.action_traces[0].inline_traces[0].act.data, {
            "price": 429496729,
            "quantity": {
                "quantity": "20.0000 EOS",
                "contract": "eosio"
            },
            "filled": {
                "quantity": "200.0000 FO",
                "contract": "eosio"
            },
            "bid_id": bid_id
        });
        checkmarketorder(fibos, "fibos", 0, "EOS@eosio", {
            "owner": "fibos",
            "price": 429496729,
            "quantity": {
                "quantity": "20.0000 EOS",
                "contract": "eosio"
            }
        });
        checkmarketorder(fibos, "fibos", "18374686479671623680", "EOS@eosio", null);
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9999900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "998700.0000 FO",
            "contract": "eosio"
        })
    });

    it(`withdraw to recover the market`, () => {
        ctx.withdrawSync("fibos", "0.0000 FO@eosio", "0.0000 EOS@eosio", bid_id, {
            authorization: "fibos"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder"), {
            "rows": [],
            "more": false
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder"), {
            "rows": [],
            "more": false
        });
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9999900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "998900.0000 FO",
            "contract": "eosio"
        })
    })

    it(`reverse bid order with market price`, () => {
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9999900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "998900.0000 FO",
            "contract": "eosio"
        })
        ctx.exchangeSync("fibos", "0.0000 EOS@eosio", "100.0000 FO@eosio", 0.1, "test", {
            authorization: "fibos"
        });
        checkmarketorder(fibos, "fibos", 0, "EOS@eosio", null);
        bid_id = fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder").rows[0].bid_id;
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder"), {
            "rows": [
                {
                    "bid_id": bid_id,
                    "owner": "fibos",
                    "price": "42949672960",
                    "quantity": {
                        "quantity": "100.0000 FO",
                        "contract": "eosio"
                    },
                    "filled": {
                        "quantity": "10.0000 EOS",
                        "contract": "eosio"
                    }
                }
            ],
            "more": false
        })
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9999890.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "998900.0000 FO",
            "contract": "eosio"
        })
    })

    it(`withdraw to recover the market`, () => {
        ctx.withdrawSync("fibos", "0.0000 FO@eosio", "0.0000 EOS@eosio", bid_id, {
            authorization: "fibos"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder"), {
            "rows": [],
            "more": false
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder"), {
            "rows": [],
            "more": false
        });
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9999900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "998900.0000 FO",
            "contract": "eosio"
        })
    })

    it(`bid order after uniswap`, () => {
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "100.0000 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1000.0000 FO",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })
        let r = ctx.exchangeSync("fibos", "0.0000 FO@eosio", "30.0000 EOS@eosio", 12, "test", {
            authorization: "fibos"
        });
        bid_id = fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder").rows[0].bid_id;
        assert.deepEqual(r.processed.action_traces[0].inline_traces[0].act.data, {
            "old_price": "42949672960",
            "new_price": "51539607552"
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "owner": "fibos",
            "oppo": "eosio",
            "from": {
                "quantity": "95.4451 FO",
                "contract": "eosio"
            },
            "to": {
                "quantity": "8.6867 EOS",
                "contract": "eosio"
            },
            "fee": {
                "quantity": "0.0262 EOS",
                "contract": "eosio"
            },
            "bid_id": 0
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[2].act.data, {
            "price": 357913941,
            "quantity": {
                "quantity": "21.2871 EOS",
                "contract": "eosio"
            },
            "filled": {
                "quantity": "255.4452 FO",
                "contract": "eosio"
            },
            "bid_id": bid_id
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "91.3133 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1095.4451 FO",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder"), {
            "rows": [
                {
                    "bid_id": bid_id,
                    "owner": "fibos",
                    "price": 357913941,
                    "quantity": {
                        "quantity": "21.2871 EOS",
                        "contract": "eosio"
                    },
                    "filled": {
                        "quantity": "255.4452 FO",
                        "contract": "eosio"
                    }
                }
            ],
            "more": false
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder"), {
            "rows": [],
            "more": false
        });
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9999908.6867 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "998549.1097 FO",
            "contract": "eosio"
        })
    })

    it(`trade with order`, () => {
        ctx.extransferSync("fibos", name, `10000.0000 EOS@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "10000.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "100.0000 FO",
            "contract": "eosio"
        })
        let r = ctx.exchangeSync(name, "0.0000 EOS@eosio", "270.0000 FO@eosio", 1 / 12, "test", {
            authorization: name
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "owner": "user1",
            "oppo": "fibos",
            "from": {
                "quantity": "21.2871 EOS",
                "contract": "eosio"
            },
            "to": {
                "quantity": "254.9343 FO",
                "contract": "eosio"
            },
            "fee": {
                "quantity": "0.5109 FO",
                "contract": "eosio"
            },
            "bid_id": bid_id
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[2].act.data, {
            "owner": "fibos",
            "oppo": "user1",
            "from": {
                "quantity": "255.4452 FO",
                "contract": "eosio"
            },
            "to": {
                "quantity": "21.2658 EOS",
                "contract": "eosio"
            },
            "fee": {
                "quantity": "0.0213 EOS",
                "contract": "eosio"
            },
            "bid_id": bid_id
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder"), {
            "rows": [],
            "more": false
        });
        bid_id = fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder").rows[0].bid_id;
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder"), {
            "rows": [
                {
                    "bid_id": bid_id,
                    "owner": "user1",
                    "price": "51539607552",
                    "quantity": {
                        "quantity": "14.5548 FO",
                        "contract": "eosio"
                    },
                    "filled": {
                        "quantity": "1.2129 EOS",
                        "contract": "eosio"
                    }
                }
            ],
            "more": false
        });
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "9977.5000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "354.9343 FO",
            "contract": "eosio"
        })
    })

    it(`withdraw to recover the market`, () => {
        ctx.withdrawSync(name, "0.0000 FO@eosio", "0.0000 EOS@eosio", bid_id, {
            authorization: name
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder"), {
            "rows": [],
            "more": false
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder"), {
            "rows": [],
            "more": false
        });
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "9978.7129 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "354.9343 FO",
            "contract": "eosio"
        })
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "91.3346 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1095.9560 FO",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })
    })

    it(`bid 1`, () => {
        let r = ctx.exchangeSync(name, "0.0000 FO@eosio", "10.0000 EOS@eosio", 10, "test", {
            authorization: name
        });
        bid_id = fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder").rows[0].bid_id;
        assert.deepEqual(r.processed.action_traces[0].inline_traces[0].act.data, {
            "price": 429496729,
            "quantity": {
                "quantity": "10.0000 EOS",
                "contract": "eosio"
            },
            "filled": {
                "quantity": "100.0000 FO",
                "contract": "eosio"
            },
            "bid_id": bid_id
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder"), {
            "rows": [
                {
                    "bid_id": bid_id,
                    "owner": "user1",
                    "price": 429496729,
                    "quantity": {
                        "quantity": "10.0000 EOS",
                        "contract": "eosio"
                    },
                    "filled": {
                        "quantity": "100.0000 FO",
                        "contract": "eosio"
                    }
                }
            ],
            "more": false
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "91.3346 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1095.9560 FO",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "9978.7129 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "254.9343 FO",
            "contract": "eosio"
        })
    })

    it(`bid 2`, () => {
        ctx.extransferSync("fibos", name, `10000.0000 FO@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "9978.7129 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "10254.9343 FO",
            "contract": "eosio"
        })
        let r = ctx.exchangeSync(name, "0.0000 FO@eosio", "100.0000 EOS@eosio", 13, "test", {
            authorization: name
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "owner": "user1",
            "oppo": "eosio",
            "from": {
                "quantity": "44.7820 FO",
                "contract": "eosio"
            },
            "to": {
                "quantity": "3.5747 EOS",
                "contract": "eosio"
            },
            "fee": {
                "quantity": "0.0108 EOS",
                "contract": "eosio"
            },
            "bid_id": 0
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "87.7599 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1140.7380 FO",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "9982.2876 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "8956.7638 FO",
            "contract": "eosio"
        })
    })

    it(`matching`, () => {
        ctx.exchangeSync("fibos", "0.0000 EOS@eosio", "100000.0000 FO@eosio", 0.1, "test", {
            authorization: "fibos"
        });
        bid_id = fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder").rows[0].bid_id
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder"), {
            "rows": [],
            "more": false
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder"), {
            "rows": [
                {
                    "bid_id": bid_id,
                    "owner": "fibos",
                    "price": "42949672960",
                    "quantity": {
                        "quantity": "98506.4286 FO",
                        "contract": "eosio"
                    },
                    "filled": {
                        "quantity": "9850.6429 EOS",
                        "contract": "eosio"
                    }
                }
            ],
            "more": false
        });
    })
});

require.main === module && test.run(console.DEBUG);