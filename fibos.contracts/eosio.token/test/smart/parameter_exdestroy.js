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
let precision = 6;
let symbol = "AAA";
let contract = "user1";
let connector_symbol = "FO";

test_util.runBIOS();
describe(`Parameter check exdestroy`, () => {
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

    let now;
    it('exdestroy error should undo session', () => {
        now = fmtDate(5);
        let r = ctx.excreateSync(name, max_supply, 0.2, max_exchange, fmt(50, precision, symbol, name), reserve_connector_balance, now, 0, 0, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
            authorization: name
        });

        r = ctx.exlocktransSync(name, name1, fmt(20, precision, symbol, name), now, now, `transfer 100 ${symbol}@${name1}`, {
            authorization: name
        });

        checklockaccount(fibos, fund, symbol, name, parseDate(now), {
            "balance": {
                "quantity": "30.000000 AAA",
                "contract": "user1"
            },
            "lock_timestamp": parseDate(now)
        });
        assert.throws(() => {
            ctx.exdestroySync(fmt(0, precision, symbol, name), {
                authorization: name
            });
        });
        checklockaccount(fibos, fund, symbol, name, parseDate(now), {
            "balance": {
                "quantity": "30.000000 AAA",
                "contract": "user1"
            },
            "lock_timestamp": parseDate(now)
        });
    });

    it(`Have a token issued by someone else`, () => {
        ctx.excreateSync(name1, max_supply, 0.2, max_exchange, fmt(50, precision, symbol, name1), reserve_connector_balance, now, 0, 0, 'eosio', {
            authorization: name1
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol, name1), 1, "setposition", {
            authorization: name1
        });
        checklockaccount(fibos, name1, symbol, name, parseDate(now), {
            "balance": {
                "quantity": "20.000000 AAA",
                "contract": "user1"
            },
            "lock_timestamp": parseDate(now)
        });
        checklockaccount(fibos, name1, symbol, name1, parseDate(now), {
            "balance": {
                "quantity": "50.000000 AAA",
                "contract": name1
            },
            "lock_timestamp": parseDate(now)
        });
        ctx.exdestroySync(fmt(0, precision, symbol, name1), {
            authorization: name1
        });
        checklockaccount(fibos, name1, symbol, name1, parseDate(now), null);
        checklockaccount(fibos, name1, symbol, name, parseDate(now), {
            "balance": {
                "quantity": "20.000000 AAA",
                "contract": "user1"
            },
            "lock_timestamp": parseDate(now)
        });
    });

    it(`Have other token issued by self`, () => {
        ctx.excreateSync(name1, fmt(10000000, precision, "BBB"), 0.2, fmt(10000000, precision, "BBB"), fmt(50, precision, "BBB", name1), reserve_connector_balance, now, 0, 0, 'eosio', {
            authorization: name1
        });
        ctx.setpositionSync(fmt(1000000000, 4, "BBB", name1), 1, "setposition", {
            authorization: name1
        });
        ctx.excreateSync(name1, fmt(10000000, precision, "AAA"), 0.3, fmt(10000000, precision, "AAA"), fmt(50, precision, "AAA", name1), reserve_connector_balance, now, 0, 0, 'eosio', {
            authorization: name1
        });
        ctx.setpositionSync(fmt(1000000000, 4, "AAA", name1), 1, "setposition", {
            authorization: name1
        });
        ctx.exlocktransSync(name1, name, fmt(20, precision, "AAA", name1), now, now, `transfer 20 ${symbol}@${name1}`, {
            authorization: name1
        });
        let newtime = fmtDate(1000);
        ctx.exlocktransSync(name, name1, fmt(20, precision, "AAA", name1), now, newtime, `transfer 20 ${symbol}@${name1}`, {
            authorization: name
        });
        checkstat(fibos, name1, "AAA", name1, {
            "supply": "0.000000 AAA",
            "max_supply": "10000000.000000 AAA",
            "issuer": name1,
            "max_exchange": "10000000.000000 AAA",
            "connector_weight": "0.29999999999999999",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "50.000000 AAA",
            "reserve_connector_balance": "10000.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        }
        );
        checklockaccount(fibos, name1, "BBB", name1, parseDate(now), {
            "balance": {
                "quantity": "50.000000 BBB",
                "contract": name1
            },
            "lock_timestamp": parseDate(now)
        });
        checklockaccount(fibos, name1, "AAA", name1, parseDate(now), {
            "balance": {
                "quantity": "30.000000 AAA",
                "contract": name1
            },
            "lock_timestamp": parseDate(now)
        });
        checklockaccount(fibos, name1, "AAA", name1, parseDate(newtime), {
            "balance": {
                "quantity": "20.000000 AAA",
                "contract": name1
            },
            "lock_timestamp": parseDate(newtime)
        });
        checklockaccount(fibos, name1, symbol, name, parseDate(now), {
            "balance": {
                "quantity": "20.000000 AAA",
                "contract": name
            },
            "lock_timestamp": parseDate(now)
        });
        ctx.exdestroySync(fmt(0, precision, "AAA", name1), {
            authorization: name1
        });
        checklockaccount(fibos, name1, "BBB", name1, parseDate(now), {
            "balance": {
                "quantity": "50.000000 BBB",
                "contract": name1
            },
            "lock_timestamp": parseDate(now)
        });
        checklockaccount(fibos, name1, symbol, name, parseDate(now), {
            "balance": {
                "quantity": "20.000000 AAA",
                "contract": name
            },
            "lock_timestamp": parseDate(now)
        });
        checklockaccount(fibos, name1, "AAA", name1, parseDate(newtime), null);
        checklockaccount(fibos, name1, "AAA", name1, parseDate(now), null);
        checkstat(fibos, name1, "AAA", name1, null);
    });
});

require.main === module && test.run(console.DEBUG);