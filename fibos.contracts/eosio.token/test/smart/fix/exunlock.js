const test = require('test');
const coroutine = require('coroutine');

test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let parseDate = test_util.parseDate;
let ctx;
describe(`test exunlock`, () => {
    let name_eos = 'eosio';

    let symbol = "SMTA";
    let symbol_fo = "FO";
    let symbol_eos = "EOS";

    let precision = 4;
    let create_time;
    var name = "user1";
    var name1 = "user2";
    before(() => {
        let name = "user1";
        if (name !== 'eosio' && name !== 'fibos') {
            test_util.user(fibos, name);
        }
        test_util.user(fibos, name1);
        ctx = fibos.contractSync("eosio.token");
        ctx.createSync("eosio", "50000000.0000 EOS", {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        let r = ctx.excreateSync("eosio", `10000000.0000 FO`, 0, `10000000.0000 FO`, `100.0000 FO`, `10000.0000 EOS`, fmtDate(), 0, 0, "eosio", {
            authorization: "eosio"
        });
        assert.equal(r.processed.action_traces[0].console, "");
        ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
            authorization: "eosio"
        });
        ctx.issueSync("fibos", `1000000.0000 FO`, `issue 100.0000 FO`, {
            authorization: "eosio"
        });
        let transfer_amount = "8000.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `transfer FO to ${name}`, {
            authorization: "fibos"
        });
        assert.equal(r.processed.action_traces[0].console, "");
    });

    it(`create token`, () => {
        create_time = fmtDate();
        ctx.excreateSync(name, fmt(10000000, precision, symbol), 0.1, fmt(10000000, precision, symbol), fmt(500, precision, symbol), fmt(100, precision, symbol_fo), create_time, 0, 0, name_eos, {
            authorization: name
        });
        ctx.exlocktransSync(name, name1, fmt(100, precision, symbol, name), create_time, create_time + 1, `transfer 100 ${symbol}@${name}`, {
            authorization: name
        });
    });

    it(`${name} unlock token`, () => {
        coroutine.sleep(2000);
        for (let i = 0; i < 10; i++) {
            ctx.exunlockSync(name, fmt(40, precision, symbol, name), create_time, `unlock times ${i}`, {
                authorization: name
            });
        }
        test_util.checkstat(fibos, name, symbol, name, {
            "supply": "400.0000 SMTA",
            "max_supply": "10000000.0000 SMTA",
            "issuer": "user1",
            "max_exchange": "10000000.0000 SMTA",
            "connector_weight": "0.10000000000000001",
            "connector_balance": "100.0000 FO",
            "reserve_supply": "100.0000 SMTA",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 0
        });
        test_util.checklockaccount(fibos, name, symbol, name, parseDate(create_time), null);
    });

    it(`${name1} unlock token`, () => {
        test_util.checklockaccount(fibos, name1, symbol, name, parseDate(create_time + 1), {
            "balance": {
                "quantity": "100.0000 SMTA",
                "contract": "user1"
            },
            "lock_timestamp": `${parseDate(create_time + 1)}`
        });
        ctx.exunlockSync(name1, fmt(100, precision, symbol, name), create_time + 1, `unlock token`, {
            authorization: name1
        });
        test_util.checkstat(fibos, name, symbol, name, {
            "supply": "400.0000 SMTA",
            "max_supply": "10000000.0000 SMTA",
            "issuer": `${name}`,
            "max_exchange": "10000000.0000 SMTA",
            "connector_weight": "0.10000000000000001",
            "connector_balance": "100.0000 FO",
            "reserve_supply": "100.0000 SMTA",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 0
        });
        test_util.checklockaccount(fibos, name1, symbol, name, parseDate(create_time + 1), null);
    });
});

require.main === module && test.run(console.DEBUG);