let test = require('test');
test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let checkaccount = test_util.checkaccount;
let fmtDate = test_util.fmtDate;
let checkunswapmarket = test_util.checkunswapmarket;
let checkmarketpool = test_util.checkmarketpool;
let checkmarketorder = test_util.checkmarketorder;
let now;
var users = {};

describe(`market pass`, () => {
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

        ctx.createSync("datamall", "50000000.0000 EOS", {
            authorization: "datamall"
        });
        ctx.excreateSync("datamall", `10000000.0000 FO`, `100.0000 FO`, 0, {
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
        ctx.extransferSync("fibos", name, `${transfer_amount} EOS@datamall`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        now = fmtDate();
        ctx.excreateSync(name, fmt(100000000000, precision, symbol), fmt(0, precision, symbol), now, {
            authorization: name
        });

        ctx.exissueSync(name, `1000000.0000 AAA@${name}`, `issue 1000000.0000 AAA`, {
            authorization: name
        });
    });

    it(`create market`, () => {
        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "9999900.0000 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "999900.0000 FO",
            "contract": "datamall"
        });
        ctx.addreservesSync("fibos", "10000.0000 EOS@datamall", "1000.0000 FO@datamall", {
            authorization: "fibos"
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "10000.0000 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "1000.0000 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "10000.00000000000000000"
        });
        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "9989900.0000 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "998900.0000 FO",
            "contract": "datamall"
        });
    });

    it(`使用user1来进行市价交易，买 30 EOS  `, () => {
        checkaccount(fibos, name, "EOS", "datamall", {
            "quantity": "100.0000 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, name, "FO", "datamall", {
            "quantity": "100.0000 FO",
            "contract": "datamall"
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "10000.0000 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "1000.0000 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        });
        let r = ctx.exchangeSync(name, "30.0000 EOS@datamall", "0.0000 FO@datamall", 0, "test", "memo", {
            authorization: name
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "owner": "user1",
            "oppo": "eosio",
            "from": {
                "quantity": "30.0000 EOS",
                "contract": "datamall"
            },
            "to": {
                "quantity": "2.9820 FO",
                "contract": "datamall"
            },
            "fee": {
                "quantity": "0.0090 FO",
                "contract": "datamall"
            },
            "bid_id": 0
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "10030.0000 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "997.0180 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })

        checkaccount(fibos, name, "EOS", "datamall", {
            "quantity": "70.0000 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, name, "FO", "datamall", {
            "quantity": "102.9820 FO",
            "contract": "datamall"
        });
    });

    it(`使用user1来进行市价交易，买 30 EOS,但是to不为0，应抛出异常 `, () => {
        assert.throws(() => {
            ctx.exchangeSync(name, "30.0000 EOS@datamall", "8.0000 FO@datamall", 0, "test", "memo", {
                authorization: name
            });
        });
    });

    it(`使用user1来进行市价交易，买 10 EOS,但是to，price不为0，应抛出异常 `, () => {
        assert.throws(() => {
            ctx.exchangeSync(name, "30.0000 EOS@datamall", "5.0000 FO@datamall", 1.2, "test", "memo", {
                authorization: name
            });
        });
    });

    it(`使用user1来进行市价交易，买 -30 EOS，应抛出异常 `, () => {
        assert.throws(() => {
            ctx.exchangeSync(name, "-30.0000 EOS@datamall", "0.0000 FO@datamall", 0, "test", "memo", {
                authorization: name
            });
        });
    });

    it(`使用user1来进行市价交易，买 30 EOS，to为负数，应抛出异常 `, () => {
        assert.throws(() => {
            ctx.exchangeSync(name, "30.0000 EOS@datamall", "-6.0000 FO@datamall", 0, "test", "memo", {
                authorization: name
            });
        });
    });

    it(`使用user1来进行市价交易，买 30 EOS，price为负数，应抛出异常 `, () => {
        assert.throws(() => {
            ctx.exchangeSync(name, "-30.0000 EOS@datamall", "0.0000 FO@datamall", -1.1, "test", "memo", {
                authorization: name
            });
        });
    });

    it(`使用user1来进行市价交易，买 -30 EOS，to,price为负数，应抛出异常 `, () => {
        assert.throws(() => {
            ctx.exchangeSync(name, "-30.0000 EOS@datamall", "-2.0000 FO@datamall", -1.1, "test", "memo", {
                authorization: name
            });
        });
    });

    it(`使用user1来进行市价交易，买 70.0001 EOS，EOS不够，应抛出异常 `, () => {
        assert.throws(() => {
            ctx.exchangeSync(name, "70.0001 EOS@datamall", "0.0000 FO@datamall", 0, "test", "memo", {
                authorization: name
            });
        });
    });

    it(`使用user1来进行市价交易，买 10.0000 EOS，权限用fibos，应抛出异常 `, () => {
        assert.throws(() => {
            ctx.exchangeSync(name, "10.0000 EOS@datamall", "0.0000 FO@datamall", 0, "test", "memo", {
                authorization: "fibos"
            });
        });
    });

    it(`使用user1来进行市价交易，买 10.000 EOS，精度错误，应抛出异常 `, () => {
        assert.throws(() => {
            ctx.exchangeSync(name, "10.000 EOS@datamall", "0.0000 FO@datamall", 0, "test", "memo", {
                authorization: name
            });
        });
    });

    it(`使用user1来进行市价交易，买 10.0000 EOS，to精度错误，应抛出异常 `, () => {
        assert.throws(() => {
            ctx.exchangeSync(name, "10.0000 EOS@datamall", "0.000 FO@datamall", 0, "test", "memo", {
                authorization: name
            });
        });
    });

    it(`使用user1来进行市价交易，买 69.9999 EOS  `, () => {
        checkaccount(fibos, name, "EOS", "datamall", {
            "quantity": "70.0000 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, name, "FO", "datamall", {
            "quantity": "102.9820 FO",
            "contract": "datamall"
        });

        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "10030.0000 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "997.0180 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })

        let r = ctx.exchangeSync(name, "69.9999 EOS@datamall", "0.0000 FO@datamall", 0, "test", "memo", {
            authorization: name
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "owner": "user1",
            "oppo": "eosio",
            "from": {
                "quantity": "69.9999 EOS",
                "contract": "datamall"
            },
            "to": {
                "quantity": "6.8892 FO",
                "contract": "datamall"
            },
            "fee": {
                "quantity": "0.0208 FO",
                "contract": "datamall"
            },
            "bid_id": 0
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "10099.9999 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "990.1288 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })

        checkaccount(fibos, name, "EOS", "datamall", {
            "quantity": "0.0001 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, name, "FO", "datamall", {
            "quantity": "109.8712 FO",
            "contract": "datamall"
        });
    });

    it(`使用fibos来进行市价交易，买 60 FO  `, () => {
        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "9989900.0000 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "998900.0000 FO",
            "contract": "datamall"
        });

        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "10099.9999 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "990.1288 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })

        let r = ctx.exchangeSync("fibos", "60.0000 FO@datamall", "0.0000 EOS@datamall", 0, "test", "memo", {
            authorization: "fibos"
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "owner": "fibos",
            "oppo": "eosio",
            "from": {
                "quantity": "60.0000 FO",
                "contract": "datamall"
            },
            "to": {
                "quantity": "575.3408 EOS",
                "contract": "datamall"
            },
            "fee": {
                "quantity": "1.7313 EOS",
                "contract": "datamall"
            },
            "bid_id": 0
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "9524.6591 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "1050.1288 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })

        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "9990475.3408 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "998840.0000 FO",
            "contract": "datamall"
        });
    });

    it(`使用fibos来进行市价交易，买 30 FO  `, () => {
        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "9990475.3408 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "998840.0000 FO",
            "contract": "datamall"
        });

        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "9524.6591 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "1050.1288 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })

        let r = ctx.exchangeSync("fibos", "30.0000 FO@datamall", "0.0000 EOS@datamall", 0, "test", "memo", {
            authorization: "fibos"
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "owner": "fibos",
            "oppo": "eosio",
            "from": {
                "quantity": "30.0000 FO",
                "contract": "datamall"
            },
            "to": {
                "quantity": "263.7486 EOS",
                "contract": "datamall"
            },
            "fee": {
                "quantity": "0.7937 EOS",
                "contract": "datamall"
            },
            "bid_id": 0
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "9260.9105 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "1080.1288 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })

        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "9990739.0894 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "998810.0000 FO",
            "contract": "datamall"
        });
    });


    it(`使用fibos来进行市价交易，买 2000000 EOS  `, () => {


        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "9990739.0894 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "998810.0000 FO",
            "contract": "datamall"
        });

        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "9260.9105 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "1080.1288 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })

        let r = ctx.exchangeSync("fibos", "2000000.0000 EOS@datamall", "0.0000 FO@datamall", 0, "test", "memo", {
            authorization: "fibos"
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "owner": "fibos",
            "oppo": "eosio",
            "from": {
                "quantity": "2000000.0000 EOS",
                "contract": "datamall"
            },
            "to": {
                "quantity": "1071.9249 FO",
                "contract": "datamall"
            },
            "fee": {
                "quantity": "3.2255 FO",
                "contract": "datamall"
            },
            "bid_id": 0
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "2009260.9105 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "8.2039 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })

        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "7990739.0894 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "999881.9249 FO",
            "contract": "datamall"
        });
    });

    it(`使用fibos来进行市价交易，买 1 EOS  `, () => {
        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "7990739.0894 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "999881.9249 FO",
            "contract": "datamall"
        });

        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "2009260.9105 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "8.2039 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })
        assert.throws(() => {
            ctx.exchangeSync("fibos", "1.0000 EOS@datamall", "0.0000 FO@datamall", 0, "test", "memo", {
                authorization: "fibos"
            });
        });
    });
});

require.main === module && test.run(console.DEBUG);