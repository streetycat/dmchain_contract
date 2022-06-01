let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
let parseDate = test_util.parseDate;
let checkstat = test_util.checkstat;
const coroutine = require('coroutine');
var users = {};


describe(`Parameter Check lock classic token`, () => {
    let fibos, ctx, name, name1;
    let symbol = "AAA", symbol1 = "BBB";
    let precision = 4;

    before(() => {
        fibos = test_util.getFIBOS();

        name = test_util.user(fibos, name);
        name1 = test_util.user(fibos, name1);
        ctx = fibos.contractSync("eosio.token");
        ctx.createSync("eosio", "50000000.0000 EOS", {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.createSync("eosio", "1000000000.0000 FO", {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 10000000.0000 EOS`, {
            authorization: "eosio"
        });
        ctx.issueSync("fibos", "10000.0000 FO", `issue 10000000.0000 FO`, {
            authorization: "eosio"
        });

        ctx.excreateSync(name, fmt(1000000000, 4, symbol), 0, fmt(0, 4, symbol), fmt(0, 4, symbol), fmt(0, 4, "FO"), fmtDate(), 0, 0, 'eosio', {
            authorization: name
        });
        ctx.excreateSync(name, `1000000000.0000 ${symbol1}`, 0.5, `1000000000.0000 ${symbol1}`, `10000000.0000 ${symbol1}`, '3000.0000 FO', fmtDate(), 0, 0, 'eosio', {
            authorization: name
        })
        ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol1, name), 1, "setposition", {
            authorization: name
        });
        ctx.exchangeSync("fibos", `200.0000 FO@eosio`, fmt(0, 4, symbol1, name), `exchange FO to ${symbol1}`, {
            authorization: "fibos"
        });
        ctx.exissueSync(name, fmt(10000, 4, symbol, name), `issue ${fmt(100, 4, symbol, name)}`, {
            authorization: name
        });
    });

    it(`memo has more than 256 bytes`, () => {
        let memo = "";
        for (let i = 0; i < 100000; i++) {
            memo += "1";
        }

        assert.throws(() => {
            ctx.exlockSync(name, fmt(100, precision, symbol, name), 0, memo, {
                authorization: name
            });
        });
    });

    it(`exlock quantity is negative`, () => {
        assert.throws(() => {
            ctx.exlockSync(name, fmt(-100, precision, symbol, name), 0, `exlock`, {
                authorization: name
            });
        });
    });

    it(`exlock symbol is not exist`, () => {
        assert.throws(() => {
            ctx.exlockSync(name, fmt(100, precision, "CCC", name), 0, `exlock`, {
                authorization: name
            });
        });
    })

    it(`exlock smart token`, () => {
        ctx.extransferSync("fibos", name1, fmt(100, 4, symbol1, name), `transfer ${fmt(100, 4, symbol1, name)}`, {
            authorization: "fibos"
        });
        checkaccount(fibos, name1, symbol1, name, {
            "quantity": "100.0000 BBB",
            "contract": name
        });
        assert.throws(() => {
            ctx.exlockSync(name, fmt(100, precision, symbol1, name), 0, `exlock`, {
                authorization: name
            });
        });
    });

    it(`exlock more than hold`, () => {
        ctx.extransferSync(name, name1, fmt(100, 4, symbol, name), `transfer ${fmt(100, 4, symbol, name)}`, {
            authorization: name
        });
        checkaccount(fibos, name1, symbol, name, {
            "quantity": "100.0000 AAA",
            "contract": name
        });
        assert.throws(() => {
            ctx.exlockSync(name1, fmt(200, precision, symbol, name), 0, `exlock`, {
                authorization: name1
            });
        });
    });

    it(`exlock is ok`, () => {
        checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "10000.0000 FO",
            "max_supply": "1000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "0.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        checkstat(fibos, name, symbol, name, {
            "supply": "10000.0000 AAA",
            "max_supply": "1000000000.0000 AAA",
            "issuer": name,
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "0.0000 AAA",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        ctx.exlockSync(name1, fmt(100, precision, symbol, name), 0, `exlock`, {
            authorization: name1
        });
        checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "10000.0000 FO",
            "max_supply": "1000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "0.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        checkstat(fibos, name, symbol, name, {
            "supply": "9900.0000 AAA",
            "max_supply": "1000000000.0000 AAA",
            "issuer": name,
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "100.0000 AAA",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        checkaccount(fibos, name1, symbol, name, {
            "quantity": "0.0000 AAA",
            "contract": name
        });
        checklockaccount(fibos, name1, symbol, name, parseDate(0), {
            "balance": {
                "quantity": "100.0000 AAA",
                "contract": name
            },
            "lock_timestamp": parseDate(0)
        });
    });

    it(`exlocktran to other`, () => {
        checklockaccount(fibos, name, symbol, name, parseDate(0), null);
        ctx.exlocktransSync(name1, name, fmt(50, precision, symbol, name), 0, 0, `exlocktrans`, {
            authorization: name1
        });
        checklockaccount(fibos, name1, symbol, name, parseDate(0), {
            "balance": {
                "quantity": "50.0000 AAA",
                "contract": name
            },
            "lock_timestamp": parseDate(0)
        });
        checklockaccount(fibos, name, symbol, name, parseDate(0), {
            "balance": {
                "quantity": "50.0000 AAA",
                "contract": name
            },
            "lock_timestamp": parseDate(0)
        });
    })

    it(`exunlock classic token`, () => {
        checkaccount(fibos, name, symbol, name, {
            "quantity": "9900.0000 AAA",
            "contract": name
        });
        checkstat(fibos, name, symbol, name, {
            "supply": "9900.0000 AAA",
            "max_supply": "1000000000.0000 AAA",
            "issuer": name,
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "100.0000 AAA",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        ctx.exunlockSync(name, fmt(50, precision, symbol, name), 0, `exunlock`, {
            authorization: name
        });
        checkstat(fibos, name, symbol, name, {
            "supply": "9950.0000 AAA",
            "max_supply": "1000000000.0000 AAA",
            "issuer": name,
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "50.0000 AAA",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        checkaccount(fibos, name, symbol, name, {
            "quantity": "9950.0000 AAA",
            "contract": name
        });
        checklockaccount(fibos, name, symbol, name, parseDate(0), null);
    });

    it(`exlock FO`, () => {
        ctx.extransferSync("fibos", name1, fmt(100, 4, "FO", "eosio"), `transfer ${fmt(100, 4, "FO", "eosio")}`, {
            authorization: "fibos"
        });
        checkaccount(fibos, name1, "FO", "eosio", {
            "quantity": "100.0000 FO",
            "contract": "eosio"
        });
        checklockaccount(fibos, name1, "FO", "eosio", parseDate(0), null);
        checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "10000.0000 FO",
            "max_supply": "1000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "0.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        ctx.exlockSync(name1, fmt(100, precision, "FO", "eosio"), 0, `exlock`, {
            authorization: name1
        });
        checkaccount(fibos, name1, "FO", "eosio", {
            "quantity": "0.0000 FO",
            "contract": "eosio"
        });
        checklockaccount(fibos, name1, "FO", "eosio", parseDate(0), {
            "balance": {
                "quantity": "100.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": parseDate(0)
        });
        checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "9900.0000 FO",
            "max_supply": "1000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "100.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
    });

    it(`unlock FO`, () => {
        checkaccount(fibos, name1, "FO", "eosio", {
            "quantity": "0.0000 FO",
            "contract": "eosio"
        });
        checklockaccount(fibos, name1, "FO", "eosio", parseDate(0), {
            "balance": {
                "quantity": "100.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": parseDate(0)
        });
        checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "9900.0000 FO",
            "max_supply": "1000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "100.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        ctx.exunlockSync(name1, fmt(50, precision, "FO", "eosio"), 0, `exunlock`, {
            authorization: name1
        });
        checkaccount(fibos, name1, "FO", "eosio", {
            "quantity": "50.0000 FO",
            "contract": "eosio"
        });
        checklockaccount(fibos, name1, "FO", "eosio", parseDate(0), {
            "balance": {
                "quantity": "50.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": parseDate(0)
        });
        checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "9950.0000 FO",
            "max_supply": "1000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "50.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
    })

    it(`locktrans FO`, () => {
        let now = fmtDate(2);
        ctx.exlocktransSync(name1, name, fmt(20, precision, "FO", "eosio"), 0, now, `exlocktrans`, {
            authorization: name1
        });
        checklockaccount(fibos, name1, "FO", "eosio", parseDate(0), {
            "balance": {
                "quantity": "30.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": parseDate(0)
        });
        checklockaccount(fibos, name, "FO", "eosio", parseDate(now), {
            "balance": {
                "quantity": "20.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": parseDate(now)
        });
        checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "9950.0000 FO",
            "max_supply": "1000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "50.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        coroutine.sleep(2000);
        ctx.exunlockSync(name, fmt(20, precision, "FO", "eosio"), now, `exunlock`, {
            authorization: name
        });
        checklockaccount(fibos, name, "FO", "eosio", parseDate(now), null);
        checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "9970.0000 FO",
            "max_supply": "1000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "30.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "20.0000 FO",
            "contract": "eosio"
        });
    })
});

require.main === module && test.run(console.DEBUG);