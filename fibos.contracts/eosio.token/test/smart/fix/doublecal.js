let test = require('test');
test.setup();

let test_util = require('../../test_util');

let fibos = test_util.getFIBOS();
let checkstat = test_util.checkstat;
let checkaccount = test_util.checkaccount;
let contract = "user1";
let fmt = test_util.fmt;

test_util.runBIOS();
describe(`precision dismatch in calculation of float`, () => {
    let ctx, name, name1, fund;
    let supply = "100000000000.000000 FOD";
    let max_supply = "100000000000.000000 FOD";
    let max_exchange = "0.000000 FOD";
    let connector_weight = 0;
    let reserve_supply = "0.000000 FOD";
    let reserve_connector_balance = "0.0000 FO";
    before(() => {
        name = contract;
        fund = 'fibos';
        if (name !== 'eosio' && name !== 'fibos') {
            test_util.user(fibos, name);
            fund = contract;
        }
        name1 = test_util.user(fibos, name1);
        ctx = fibos.contractSync("eosio.token");
        ctx.excreateSync("eosio", max_supply, connector_weight, max_exchange, reserve_supply, reserve_connector_balance, 0, 0, 0, 'eosio', {
            authorization: "eosio"
        });
        ctx.setpositionSync("1000000.000000 FOD@eosio", 1, "setposition", {
            authorization: "fibos"
        });
        ctx.exissueSync(name, "1000000.000000 FOD@eosio", "issue", {
            authorization: "eosio"
        });
        ctx.excreateSync("eosio", "1000000.000000 STUSD", 1, "1000000.000000 STUSD", "500000.000000 STUSD", "500000.000000 FOD", 0, 0, 0, "eosio", {
            authorization: "eosio"
        });
        ctx.setpositionSync("1000000.000000 STUSD@eosio", 1, "setposition", {
            authorization: "fibos"
        });
    });

    it(`check stats`, () => {
        checkstat(fibos, "eosio", "STUSD", "eosio", {
            "supply": "0.000000 STUSD",
            "max_supply": "1000000.000000 STUSD",
            "issuer": "eosio",
            "max_exchange": "1000000.000000 STUSD",
            "connector_weight": "1.00000000000000000",
            "connector_balance": "0.000000 FOD",
            "reserve_supply": "500000.000000 STUSD",
            "reserve_connector_balance": "500000.000000 FOD",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        checkaccount(fibos, name, "FOD", "eosio", {
            "quantity": "1000000.000000 FOD",
            "contract": "eosio"
        });
    });

    it(`test exchange`, () => {
        var ctx = fibos.contractSync("eosio.token");
        let exchange_to_amount = fmt(0, 6, "STUSD", "eosio");
        for (var i = 0; i < 500; i++) {
            var amount = (Math.random() * 1000).toFixed(6);
            let exchange_amount = fmt(amount, 6, "FOD", "eosio");
            ctx.exchangeSync(name, exchange_amount, exchange_to_amount, `exchange FOD to STUSD`, {
                authorization: name
            });
            let result = fibos.getTableRowsSync(true, "eosio.token", "eosio", "stats");
            let supply = result.rows[1].supply.split(" ")[0];
            let connector_balance = result.rows[1].connector_balance.split(" ")[0];
            console.error("第", i, "次");
            assert.deepEqual(supply, connector_balance);
        }
    });
});

require.main === module && test.run(console.DEBUG);
