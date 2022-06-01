let test = require('test');
test.setup();

let test_util = require('../test_util');

let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let checkstat = test_util.checkstat;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
let parseDate = test_util.parseDate;
let precision = 4;
let symbol = "AAA";
let symbol2 = "CCC";
let contract = "user1";

test_util.runBIOS();
describe(`Parameter check position`, () => {
    let ctx, name, name1, fund;
    let max_supply = fmt(100000000, precision, symbol);
    let max_exchange = fmt(100000000, precision, symbol);
    let reserve_supply = fmt(5000000, precision, symbol);
    let max_supply2 = fmt(100000000, precision, symbol2);
    let max_exchange2 = fmt(100000000, precision, symbol2);
    let reserve_supply2 = fmt(5000000, precision, symbol2);
    let reserve_connector_balance = "1000000.0000 FO";

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
        ctx.excreateSync("eosio", `10000000.0000 FO`, 0, `10000000.0000 FO`, `1000.0000 FO`, `100000.0000 EOS`, 0, 0, 0, 'eosio', {
            authorization: "eosio"
        });
        ctx.excreateSync(name, max_supply, 0.2, max_exchange, reserve_supply, reserve_connector_balance, fmtDate(), 0.1, 0.1, 'eosio', {
            authorization: name
        })
        ctx.excreateSync(name, max_supply2, 0.2, max_exchange2, reserve_supply2, reserve_connector_balance, fmtDate(), 0.1, 0.1, 'eosio', {
            authorization: name
        })
    });

    it(`token created by eosio can't set position by others`, () => {
        assert.throws(() => {
            ctx.setpositionSync(fmt(0, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "eosio"
            });
        });
        assert.throws(() => {
            ctx.setpositionSync(fmt(0, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "eosio"
            });
        });
        assert.throws(() => {
            ctx.setpositionSync(fmt(0, 4, "FO", "eosio"), 1, "setposition", {
                authorization: name
            });
        });
    })

    it(`close position can not issue`, () => {
        assert.throws(() => {
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
        });
    });

    it(`token created by eosio can set position by fibos`, () => {
        ctx.setpositionSync(fmt(0, 4, "EOS", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
    });

    it(`oepn position can issue`, () => {
        ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
            authorization: "eosio"
        });
    });

    it(`close position can unlock`, () => {
        ctx.setpositionSync(fmt(0, 4, "FO", "eosio"), 0, "setposition", {
            authorization: "fibos"
        });
        checklockaccount(fibos, "fibos", "FO", "eosio", parseDate(0), {
            "balance": {
                "quantity": "1000.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": parseDate(0)
        });
        ctx.exunlockSync("fibos", "100.0000 FO@eosio", 0, `exunlock`, {
            authorization: "fibos"
        })
        checklockaccount(fibos, "fibos", "FO", "eosio", parseDate(0), {
            "balance": {
                "quantity": "900.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": parseDate(0)
        });
    });

    it(`other smart token can't issue while token is close position`, () => {
        checkstat(fibos, name, symbol, contract, {
            "supply": "0.0000 AAA",
            "max_supply": "100000000.0000 AAA",
            "issuer": "user1",
            "max_exchange": "100000000.0000 AAA",
            "connector_weight": "0.20000000000000001",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "5000000.0000 AAA",
            "reserve_connector_balance": "1000000.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.10000000000000001",
            "sell_fee": "0.10000000000000001",
            "position": 0
        });
        assert.throws(() => {
            ctx.exissueSync(name, `1000.0000 ${symbol}@${contract}`, `issue`, {
                authorization: name
            });
        });
    });

    it(`open position, smart token can‘t issue, because only classic token can issue`, () => {
        ctx.setpositionSync(fmt(0, 4, symbol, contract), 1, "setposition", {
            authorization: name
        });
        checkstat(fibos, name, symbol, contract, {
            "supply": "0.0000 AAA",
            "max_supply": "100000000.0000 AAA",
            "issuer": "user1",
            "max_exchange": "100000000.0000 AAA",
            "connector_weight": "0.20000000000000001",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "5000000.0000 AAA",
            "reserve_connector_balance": "1000000.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.10000000000000001",
            "sell_fee": "0.10000000000000001",
            "position": 1
        });
        assert.throws(() => {
            ctx.exissueSync(name, `1000.0000 ${symbol}@${contract}`, `issue`, {
                authorization: name
            });
        });
    });

    it(`close position,classic token can't issue`, () => {
        symbol = "BBB";
        let r = ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 0, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
            authorization: name
        });
        checkstat(fibos, name, symbol, contract, {
            "supply": "0.0000 BBB",
            "max_supply": "100000000000.0000 BBB",
            "issuer": "user1",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": `0.0000 ${symbol}`,
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 0
        });
        assert.throws(() => {
            ctx.exissueSync(name, `1000.0000 ${symbol}@${contract}`, `issue`, {
                authorization: name
            });
        });
    });

    it(`open position, classic token can issue`, () => {
        ctx.setpositionSync(fmt(0, 4, symbol, contract), 1, "setposition", {
            authorization: name
        });
        checkstat(fibos, name, symbol, contract, {
            "supply": "0.0000 BBB",
            "max_supply": "100000000000.0000 BBB",
            "issuer": "user1",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": `0.0000 ${symbol}`,
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        ctx.exissueSync(name, `1000.0000 ${symbol}@${contract}`, `issue`, {
            authorization: name
        });
        checkstat(fibos, name, symbol, contract, {
            "supply": "1000.0000 BBB",
            "max_supply": "100000000000.0000 BBB",
            "issuer": "user1",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": `0.0000 ${symbol}`,
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
    });

    it(`A close, B open,FO open ,A->FO->B failure`, () => {
        ctx.setpositionSync(fmt(0, 4, `AAA`, name), 0, "setposition pppp", {
            authorization: name
        });
        assert.throws(() => {
            test_util.exchange(fibos, name, `1.0000 ${symbol}@${name}`, `0.0000 ${symbol2}@${name}`, `exchange ${symbol} to ${symbol2}`)
        });
    });

    it(`A open, B close,FO open ,A->FO->B failure`, () => {
        ctx.setpositionSync(fmt(0, 4, `AAA`, name), 1, "setposition", {
            authorization: name
        });
        ctx.setpositionSync(fmt(0, 4, `CCC`, name), 0, "setposition ddd", {
            authorization: name
        });
        assert.throws(() => {
            test_util.exchange(fibos, name, `1.0000 ${symbol}@${name}`, `0.0000 ${symbol2}@${name}`, `exchange ${symbol} to ${symbol2}`)
        });
    });

    it(`FO close, FO can't issue`, () => {
        ctx.setpositionSync(fmt(0, 4, `FO`, `eosio`), 0, "setposition dadafdaf", {
            authorization: "fibos"
        });
        assert.throws(() => {
            ctx.exissueSync(name, `1000.0000 FO@eosio`, `issue`, {
                authorization: "eosio"
            });
        });
    });

    it(`setposition with error authorization`, () => {
        assert.throws(() => {
            ctx.setpositionSync(fmt(0, 4, `${symbol2}`, `${name}`), 1, "setposition sss", {
                authorization: "fibos"
            });
        });
        assert.throws(() => {
            ctx.setpositionSync(fmt(0, 4, "FO", "eosio"), 0, "setposition sdfs", {
                authorization: name
            });
        });
    })
});
require.main === module && test.run(console.DEBUG);
