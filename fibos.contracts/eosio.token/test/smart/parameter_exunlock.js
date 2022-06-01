let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
let checkstat = test_util.checkstat;
let fmtDate = test_util.fmtDate;
let parseDate = test_util.parseDate;
let now;
var users = {};

describe(`Permission check exunlock`, () => {
    let symbol = "AAA";
    let contract = "user1"
    let fibos, ctx, name, name1;
    let precision = 6;

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
        let transfer_amount = "10.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        now = fmtDate();
        ctx.excreateSync(name, fmt(100000000000, precision, symbol), 0.5, fmt(100000000000, precision, symbol), fmt(300000000, precision, symbol), fmt(1000000, 4, "FO"), now, 0, 0, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
            authorization: name
        });
    });

    it(`exunlock when user don't have balance`, () => {
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "10.0000 FO",
            "contract": "eosio"
        });
        assert.throws(() => {
            ctx.exunlockSync(name, fmt(10000, precision, symbol, name), 0, fmt(100, precision, symbol, name), {
                authorization: name
            });
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "10.0000 FO",
            "contract": "eosio"
        });
        checkaccount(fibos, name, symbol, name, null);
    });

    it(`exunlock when user's balance is 0`, () => {
        test_util.exchange(fibos, name, fmt(0.005, 4, "FO", "eosio"), fmt(0, precision, symbol, name), `exchange FO@eosio to ${symbol}@${name}`)
        checkaccount(fibos, name, symbol, name, {
            "quantity": fmt(0.749999, precision, symbol),
            "contract": name
        });
        test_util.exchange(fibos, name, fmt(0.749999, precision, symbol, name), fmt(0, 4, "FO", "eosio"), `exchange FO@eosio to ${symbol}@${name}`)

        checklockaccount(fibos, name, symbol, name, parseDate(now), {
            "balance": {
                "quantity": fmt(300000000, precision, symbol),
                "contract": name
            },
            "lock_timestamp": parseDate(now)
        });
        checkaccount(fibos, name, symbol, name, {
            "quantity": fmt(0, precision, symbol),
            "contract": name
        });

        checkaccount(fibos, name, symbol, name, {
            "quantity": fmt(0, precision, symbol),
            "contract": name
        });
        assert.throws(() => {
            ctx.exunlockSync(name, fmt(10000000, precision, symbol, name), 0, fmt(100, precision, symbol, name), {
                authorization: name
            });
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "9.9999 FO",
            "contract": "eosio"
        });
        checkaccount(fibos, name, symbol, name, {
            "quantity": fmt(0, precision, symbol),
            "contract": name
        });
        checklockaccount(fibos, name, symbol, name, parseDate(now), {
            "balance": {
                "quantity": fmt(300000000, precision, symbol),
                "contract": name
            },
            "lock_timestamp": parseDate(now)
        });
    });

    it(`exunlock quantity non positive value`, () => {
        assert.throws(() => {
            ctx.exunlockSync(name, fmt(0, precision, symbol, name), 0, fmt(100, precision, symbol, name), {
                authorization: name
            });
        });

        assert.throws(() => {
            ctx.exunlockSync(name, fmt(-1, precision, symbol, name), 0, fmt(100, precision, symbol, name), {
                authorization: name
            });
        });
    });

    it(`exunlock quantity incorrect precision`, () => {
        assert.throws(() => {
            ctx.exunlockSync(name, fmt(100, precision + 1, symbol, name), 0, fmt(100, precision, symbol, name), {
                authorization: name
            });
        });
    });

    it(`exunlock quantity incorrect symbol`, () => {
        assert.throws(() => {
            ctx.exunlockSync(name, fmt(100, precision, "SYM", name), 0, fmt(100, precision, symbol, name), {
                authorization: name
            });
        });
    });

    it(`exunlock quantity incorrect name`, () => {
        assert.throws(() => {
            ctx.exunlockSync(name, fmt(100, precision, symbol, "name123"), 0, fmt(100, precision, symbol, name), {
                authorization: name
            });
        });
    });

    it(`exunlock when connector balance is less then 1`, () => {
        checkstat(fibos, name, symbol, name, {
            "supply": "0.000000 AAA",
            "max_supply": "100000000000.000000 AAA",
            "issuer": "user1",
            "max_exchange": "100000000000.000000 AAA",
            "connector_weight": "0.50000000000000000",
            "connector_balance": "0.0001 FO",
            "reserve_supply": "300000000.000000 AAA",
            "reserve_connector_balance": "1000000.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });

        assert.throws(() => {
            ctx.exunlockSync(name, fmt(300000000, precision, symbol, name), 0, fmt(100, precision, symbol, name), {
                authorization: name
            });
        });

        checkstat(fibos, name, symbol, name, {
            "supply": "0.000000 AAA",
            "max_supply": "100000000000.000000 AAA",
            "issuer": "user1",
            "max_exchange": "100000000000.000000 AAA",
            "connector_weight": "0.50000000000000000",
            "connector_balance": "0.0001 FO",
            "reserve_supply": "300000000.000000 AAA",
            "reserve_connector_balance": "1000000.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });

        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "9.9999 FO",
            "contract": "eosio"
        });
        checkaccount(fibos, name, symbol, name, {
            "quantity": fmt(0, precision, symbol),
            "contract": name
        });
        checklockaccount(fibos, name, symbol, name, parseDate(now), {
            "balance": {
                "quantity": fmt(300000000, precision, symbol),
                "contract": name
            },
            "lock_timestamp": parseDate(now)
        });
    });
});

require.main === module && test.run(console.DEBUG);