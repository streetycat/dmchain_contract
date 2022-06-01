let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let checkaccount = test_util.checkaccount;
let fmtDate = test_util.fmtDate;
let checkunswapmarket = test_util.checkunswapmarket;
let checkmarketpool = test_util.checkmarketpool;
let checkmarketorder = test_util.checkmarketorder;
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

    it(`使用fibos来进行限价交易，以11的价格卖1000个EOS ,在价格到达设定价格时买不完，剩余的挂单`, () => {

        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9980000.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "989000.0000 FO",
            "contract": "eosio"
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
        let r = ctx.exchangeSync("fibos", "1000.0000 EOS@eosio", "0.0000 FO@eosio", 11, "test", "memo", {
            authorization: "fibos"
        });

        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "owner": "fibos",
            "oppo": "eosio",
            "from": {
                "quantity": "488.0885 EOS",
                "contract": "eosio"
            },
            "to": {
                "quantity": "46.3977 FO",
                "contract": "eosio"
            },
            "fee": {
                "quantity": "0.1397 FO",
                "contract": "eosio"
            },
            "bid_id": 0
        });

        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10488.0885 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "953.6023 FO",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })

        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9979000.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "989046.3977 FO",
            "contract": "eosio"
        });

        r = fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder");
        r = fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder");
    });

    it(`使用user1来进行加仓，EOS加110，FO加10 ,会自动撤单并和市场进行uniswap `, () => {

        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10488.0885 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "953.6023 FO",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })

        let r = ctx.addreservesSync(name, "110.0000 EOS@eosio", "10.0000 FO@eosio", {
            authorization: name
        });

        let bid_id = r.processed.action_traces[0].inline_traces[1].act.data.bid_id

        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "bid_id": bid_id,
            "state": 3
        });

        assert.deepEqual(r.processed.action_traces[0].inline_traces[3].act.data, {
            "owner": "fibos",
            "oppo": "eosio",
            "from": {
                "quantity": "0.7684 EOS",
                "contract": "eosio"
            },
            "to": {
                "quantity": "0.0696 FO",
                "contract": "eosio"
            },
            "fee": {
                "quantity": "0.0003 FO",
                "contract": "eosio"
            },
            "bid_id": 0
        });

        bid_id = r.processed.action_traces[0].inline_traces[4].act.data.bid_id

        assert.deepEqual(r.processed.action_traces[0].inline_traces[4].act.data, {
            "price": 390451572,
            "quantity": {
                "quantity": "46.4676 FO",
                "contract": "eosio"
            },
            "filled": {
                "quantity": "511.1431 EOS",
                "contract": "eosio"
            },
            "bid_id": bid_id
        });

        r = fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder");
        r = fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder");
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10598.8569 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "963.5327 FO",
                "contract": "eosio"
            },
            "total_weights": "10104.87320175689274038"
        })

        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9979000.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "989046.4673 FO",
            "contract": "eosio"
        });

        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "9890.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "9990.0000 FO",
            "contract": "eosio"
        });
    });

    it(`(pass, out): outreserves 1% 不会进行和市场的uniswap`, () => {
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10598.8569 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "963.5327 FO",
                "contract": "eosio"
            },
            "total_weights": "10104.87320175689274038"
        })

        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9979000.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "989046.4673 FO",
            "contract": "eosio"
        });

        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "9890.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "9990.0000 FO",
            "contract": "eosio"
        });
        ctx.outreservesSync(name, "0.0000 FO@eosio", "0.0000 EOS@eosio", 0.01, {
            authorization: name
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10597.7580 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "963.4328 FO",
                "contract": "eosio"
            },
            "total_weights": "10103.82446973932383116"
        });

        r = fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder");
        r = fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder");
    });

});

require.main === module && test.run(console.DEBUG);