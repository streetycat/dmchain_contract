let test = require('test');
test.setup();

const coroutine = require('coroutine');
let test_util = require('../test_util');

let checkstat = test_util.checkstat;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let parseDate = test_util.parseDate;
let createTime;
let precision = 6;
let symbol = "AAA";
let contract = "user1";
let connector_symbol = "FO";

test_util.runBIOS();
describe(`Parameter check exretire`, () => {
    let ctx, name, name1, fund;
    let max_supply = fmt(10000000, precision, symbol);
    let max_exchange = fmt(10000000, precision, symbol);
    let connector_weight = "0.20000000000000000";
    let connector_balance = "0.0000 FO";
    let reserve_supply = fmt(500, precision, symbol);
    let reserve_connector_balance = "10000.0000 FO";

    before(() => {
        name = contract;
        fund = 'fibos';
        if (name !== 'eosio' && name !== 'fibos') {
            test_util.user(fibos, name);
            fund = contract;
        }
        name1 = test_util.user(fibos, name1);
        ctx = fibos.contractSync("eosio.token");

        ctx.createSync("eosio", "50000000.0000 EOS", {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });

        ctx.excreateSync("eosio", `10000000.0000 FO`, 0, `10000000.0000 FO`, `100.0000 FO`, `10000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
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
        let transfer_amount = "80000.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
    });

    let newTime1, newTime2, newTime3;
    it(`under expiration time`, () => {
        let now = fmtDate();
        ctx.excreateSync(name, max_supply, 0.2, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
            authorization: name
        });
        createTime = now;
        test_util.exchange(fibos, name, `10000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
        coroutine.sleep(2000);
        ctx = fibos.contractSync("eosio.token");

        ctx.exunlockSync(name, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
            authorization: name
        });
        test_util.checkstat(fibos, name, symbol, contract, {
            "supply": "174.349177 AAA",
            "max_supply": "10000000.000000 AAA",
            "issuer": "user1",
            "max_exchange": "10000000.000000 AAA",
            "connector_weight": "0.20000000000000001",
            "connector_balance": "16723.2000 FO",
            "reserve_supply": "400.000000 AAA",
            "reserve_connector_balance": "3276.8000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });

        newTime1 = fmtDate();
        let r = ctx.exlocktransSync(name, name1, fmt(10, precision, symbol, name), createTime, newTime1, `transfer 50 ${symbol}@${name}`, {
            authorization: name
        });
        newTime2 = fmtDate(3);
        r = ctx.exlocktransSync(name, name1, fmt(15, precision, symbol, name), createTime, newTime2, `transfer 60 ${symbol}@${name} 1`, {
            authorization: name
        });
        newTime3 = fmtDate(300);
        r = ctx.exlocktransSync(name, name1, fmt(375, precision, symbol, name), createTime, newTime3, `transfer 50 ${symbol}@${name} 2`, {
            authorization: name
        });

    });

    it(`foundation only has one but greater than holding`, () => {
        var r = ctx.exlocktransSync(name1, name, fmt(10, precision, symbol, name), newTime1, newTime1, `transfer 50 ${symbol}@${name1} 3`, {
            authorization: name1
        });
        checklockaccount(fibos, fund, symbol, name, parseDate(newTime1), {
            "balance": {
                "quantity": "10.000000 AAA",
                "contract": "user1"
            },
            "lock_timestamp": parseDate(newTime1)
        });
        assert.throws(() => {
            ctx.exretireSync(name, fmt(20, precision, symbol, name), `hi`, {
                authorization: name
            });
        });
    });

    it(`foundation has many but greater than holding`, () => {
        var r = ctx.exlocktransSync(name1, name, fmt(15, precision, symbol, name), newTime2, newTime2, `transfer 50 ${symbol}@${name1} 4`, {
            authorization: name1
        });
        checklockaccount(fibos, fund, symbol, name, parseDate(newTime1), {
            "balance": {
                "quantity": "10.000000 AAA",
                "contract": "user1"
            },
            "lock_timestamp": parseDate(newTime1)
        });
        checklockaccount(fibos, fund, symbol, name, parseDate(newTime2), {
            "balance": {
                "quantity": "15.000000 AAA",
                "contract": "user1"
            },
            "lock_timestamp": parseDate(newTime2)
        });
        assert.throws(() => {
            ctx.exretireSync(name, fmt(90, precision, symbol, name), `hi`, {
                authorization: name
            });
        });
    });

    it(`less than holding`, () => {
        ctx.exretireSync(name, fmt(6, precision, symbol, name), `hi`, {
            authorization: name
        });
        checkstat(fibos, name, symbol, contract, {
            "supply": "174.036657 AAA",
            "max_supply": "10000000.000000 AAA",
            "issuer": "user1",
            "max_exchange": "9999994.000000 AAA",
            "connector_weight": "0.20211137809037419",
            "connector_balance": "16723.2000 FO",
            "reserve_supply": "394.312520 AAA",
            "reserve_connector_balance": "3276.8000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        checkaccount(fibos, name, symbol, name, {
            "quantity": "174.036657 AAA",
            "contract": "user1"
        });
        checklockaccount(fibos, fund, symbol, name, parseDate(newTime1), {
            "balance": {
                "quantity": "4.312520 AAA",
                "contract": "user1"
            },
            "lock_timestamp": parseDate(newTime1)
        });
    });
});

require.main === module && test.run(console.DEBUG);