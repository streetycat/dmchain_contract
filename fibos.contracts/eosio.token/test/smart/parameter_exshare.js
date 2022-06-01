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
    let now;

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

        now = fmtDate();
        ctx.excreateSync(name, max_supply, 0.2, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
            authorization: name
        });
    });

    it(`exshare`, () => {
        test_util.exchange(fibos, name, `10000.0000 FO@eosio`, fmt(0, precision, symbol, name), `exchange FO to ${symbol}`)
        checkstat(fibos, name, symbol, name, {
            "supply": "74.349177 AAA",
            "max_supply": "10000000.000000 AAA",
            "issuer": "user1",
            "max_exchange": "10000000.000000 AAA",
            "connector_weight": "0.20000000000000001",
            "connector_balance": "10000.0000 FO",
            "reserve_supply": "500.000000 AAA",
            "reserve_connector_balance": "10000.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        checkaccount(fibos, name, symbol, name, {
            "quantity": "74.349177 AAA",
            "contract": name
        });
        checklockaccount(fibos, name, symbol, name, parseDate(now), {
            "balance": {
                "quantity": "500.000000 AAA",
                "contract": "user1"
            },
            "lock_timestamp": parseDate(now)
        });

        ctx.exshareSync(fmt(200, 4, "FO", "eosio"), fmt(0, precision, symbol, name), "exshare", {
            authorization: name
        });

        checkstat(fibos, name, symbol, name, {
            "supply": "76.044428 AAA",
            "max_supply": "10000000.000000 AAA",
            "issuer": "user1",
            "max_exchange": "10000000.000000 AAA",
            "connector_weight": "0.20200000000000001",
            "connector_balance": "10200.0000 FO",
            "reserve_supply": "498.304749 AAA",
            "reserve_connector_balance": "10000.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });

        checkaccount(fibos, name, symbol, name, {
            "quantity": "76.044428 AAA",
            "contract": name
        });
        checklockaccount(fibos, name, symbol, name, parseDate(now), {
            "balance": {
                "quantity": "498.304749 AAA",
                "contract": "user1"
            },
            "lock_timestamp": parseDate(now)
        });
    });

    it(`exshare with noncorrect connector balance`, () => {
        ctx.extransferSync("fibos", name, `97000.0000 EOS@eosio`, `extransfer`, {
            authorization: "fibos"
        });
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "97000.0000 EOS",
            "contract": "eosio"
        });

        assert.throws(() => {
            ctx.exshareSync(fmt(200, 4, "EOS", "eosio"), fmt(0, precision, symbol, name), "exshare", {
                authorization: name
            });
        });
    });

    // current fibos.js can't catch param error,waiting to be fixed.
    xit(`invalid currency`, () => {
        assert.throws(() => {
            ctx.exshareSync(fmt(200, 4, "Fo", "eosio"), fmt(0, precision, symbol, name), "exshare", {
                authorization: name
            });
        });
    });

    it(`must exshare positive amount`, () => {
        assert.throws(() => {
            ctx.exshareSync(fmt(-200, 4, "FO", "eosio"), fmt(0, precision, symbol, name), "exshare", {
                authorization: name
            });
        });
    });

    // current fibos.js can't catch param error,waiting to be fixed.
    xit(`invalid currency symbol name`, () => {
        assert.throws(() => {
            ctx.exshareSync(fmt(200, 4, "FO", "eosio"), fmt(0, precision, symbol.toLowerCase(), name), "exshare", {
                authorization: name
            });
        });
    });

    it(`cannot exshare to the same currency`, () => {
        assert.throws(() => {
            ctx.exshareSync(fmt(20, precision, symbol, name), fmt(0, precision, symbol, name), "exshare", {
                authorization: name
            });
        });
    });

    it(`memo has more than 256 bytes`, () => {
        let memo = "";
        for (let i = 0; i < 100000; i++) {
            memo += "1";
        }

        assert.throws(() => {
            ctx.exshareSync(fmt(200, 4, "FO", "eosio"), fmt(0, precision, symbol, name), memo, {
                authorization: name
            });
        });
    });

    it(`missing authority of user1`, () => {
        assert.throws(() => {
            ctx.exshareSync(fmt(200, 4, "FO", "eosio"), fmt(0, precision, symbol, name), "exshare", {
                authorization: name1
            });
        });
    });

    it(`token with symbol does not exist`, () => {
        assert.throws(() => {
            ctx.exshareSync(fmt(200, 4, "FO", "eosio"), fmt(0, precision, symbol + "N", name), "exshare", {
                authorization: name
            });
        });
    });

    it(`only smart token can be adjusted`, () => {
        let now = fmtDate();
        let symbol = "BBB";
        let max_supply = fmt(10000000, precision, symbol);
        let max_exchange = fmt(10000000, precision, symbol);
        let reserve_supply = fmt(500, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";

        ctx.excreateSync(name, max_supply, 0, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
            authorization: name
        });

        assert.throws(() => {
            ctx.exshareSync(fmt(200, 4, "FO", "eosio"), fmt(0, precision, symbol, name), "exshare", {
                authorization: name
            });
        });
    });

    it(`leading to invalid connector_weight`, () => {
        assert.throws(() => {
            ctx.exshareSync(fmt(100000000000, 4, "FO", "eosio"), fmt(0, precision, symbol, name), "exshare", {
                authorization: name
            });
        });
    });
});

require.main === module && test.run(console.DEBUG);