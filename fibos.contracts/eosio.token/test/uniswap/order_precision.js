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

describe(`order precision`, () => {
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

        ctx.createSync("eosio", "50000000.000000 FOD", {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 6, "FOD", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.issueSync("fibos", `1000000.000000 FOD`, `issue 1000000.000000 FOD`, {
            authorization: "eosio"
        });

        let transfer_amount = "100.0000";
        let fod_amount = "100.000000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        ctx.extransferSync("fibos", name, `${transfer_amount} EOS@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        ctx.extransferSync("fibos", name, `${fod_amount} FOD@eosio`, `exchange FO to ${symbol}@${name}`, {
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
            "quantity": "9999900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FOD", "eosio", {
            "quantity": "999900.000000 FOD",
            "contract": "eosio"
        });
        ctx.addreservesSync("fibos", "10000.0000 EOS@eosio", "1000.000000 FOD@eosio", {
            authorization: "fibos"
        });
        checkunswapmarket(fibos, "FOD@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10000.0000 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1000.000000 FOD",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "10000.00000000000000000"
        });
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9989900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FOD", "eosio", {
            "quantity": "998900.000000 FOD",
            "contract": "eosio"
        });
    });

    it(`使用fibos来进行限价交易，以11的价格卖1000个EOS ,在价格到达设定价格时买不完，剩余的挂单`, () => {

        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9989900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FOD", "eosio", {
            "quantity": "998900.000000 FOD",
            "contract": "eosio"
        });

        checkunswapmarket(fibos, "FOD@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10000.0000 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1000.000000 FOD",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })
        let r = ctx.exchangeSync("fibos", "1000.0000 EOS@eosio", "0.000000 FOD@eosio", 11, "test", "memo", {
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
                "quantity": "46.397798 FOD",
                "contract": "eosio"
            },
            "fee": {
                "quantity": "0.139613 FOD",
                "contract": "eosio"
            },
            "bid_id": 0
        });

        checkunswapmarket(fibos, "FOD@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10488.0885 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "953.602202 FOD",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })

        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9988900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FOD", "eosio", {
            "quantity": "998946.397798 FOD",
            "contract": "eosio"
        });

        r = fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder");
        r = fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder");
    });

    it(`使用name来进行限价交易，以1/11的价格卖46.537410个FOD ,在价格超过设定的价格时进行订单撮合，正好与订单全部撮合完 `, () => {

        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9988900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FOD", "eosio", {
            "quantity": "998946.397798 FOD",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "100.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FOD", "eosio", {
            "quantity": "100.000000 FOD",
            "contract": "eosio"
        });

        checkunswapmarket(fibos, "FOD@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10488.0885 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "953.602202 FOD",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })
        ctx.exchangeSync(name, "46.537410 FOD@eosio", "0.0000 EOS@eosio", 1 / 11, "test2", "memo2", {
            authorization: name
        });

        let r = fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder");
        r = fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder");
        checkunswapmarket(fibos, "FOD@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10489.1124 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "953.648740 FOD",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })

        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9988900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FOD", "eosio", {
            "quantity": "998992.888670 FOD",
            "contract": "eosio"
        });

        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "610.8876 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FOD", "eosio", {
            "quantity": "53.462590 FOD",
            "contract": "eosio"
        });

    });
});

require.main === module && test.run(console.DEBUG);