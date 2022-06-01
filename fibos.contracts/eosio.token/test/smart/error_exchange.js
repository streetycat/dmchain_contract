let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let checkstat = test_util.checkstat;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;

describe(`Mismatch symbol1 precision:`, () => {
    let ctx, name, name1, fund;
    let connector_symbol = "FO";
    let contract = "user1";
    let symbol1 = "AAA";
    let precision1 = 4;
    let max_supply1 = fmt(10000000, precision1, symbol1);
    let max_exchange1 = fmt(10000000, precision1, symbol1);
    let reserve_supply1 = fmt(500, precision1, symbol1);

    let symbol2 = "AAA";
    let precision2 = 6;
    let max_supply2 = fmt(10000000, precision2, symbol2);
    let max_exchange2 = fmt(10000000, precision2, symbol2);
    let reserve_supply2 = fmt(500, precision2, symbol2);

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
        let transfer_amount = "80000.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol1}@${name}`, {
            authorization: "fibos"
        });
    });

    it(`create ${symbol1} with precision ${precision1}, make a transfer, then destroy, and create ${symbol2} with precision ${precision2}, then exchange`, () => {
        ctx.excreateSync(name, max_supply1, 1, max_exchange1, reserve_supply1, reserve_connector_balance, fmtDate(), 0, 0, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol1, name), 1, "setposition", {
            authorization: name
        });

        checkstat(fibos, name, symbol1, name, {
            "supply": "0.0000 AAA",
            "max_supply": "10000000.0000 AAA",
            "issuer": "user1",
            "max_exchange": "10000000.0000 AAA",
            "connector_weight": "1.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "500.0000 AAA",
            "reserve_connector_balance": "10000.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        test_util.exchange(fibos, name, `10000.0000 ${connector_symbol}@eosio`, fmt(0, precision1, symbol1, name), `exchange ${connector_symbol} to ${symbol1}@${name}`)
        ctx.extransferSync(name, name1, fmt(1, precision1, symbol1, name), `transfer ${fmt(1, precision1, symbol1, name)} to ${name1}`, {
            authorization: name
        });
        ctx.extransferSync(name1, name, fmt(1, precision1, symbol1, name), `transfer ${fmt(1, precision1, symbol1, name)} to ${name}`, {
            authorization: name1
        });
        let r = ctx.exdestroySync(fmt(0, precision1, symbol1, name), {
            authorization: name
        });
        assert.equal(r.processed.action_traces[0].console, "");

        ctx.excreateSync(name, max_supply2, 1, max_exchange2, reserve_supply2, reserve_connector_balance, fmtDate(), 0, 0, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol2, name), 1, "setposition", {
            authorization: name
        });

        assert.equal(r.processed.action_traces[0].console, "");

        test_util.exchange(fibos, name, `10000.0000 ${connector_symbol}@eosio`, fmt(0, precision2, symbol2, name), `exchange ${connector_symbol} to ${symbol1}@${name}`)
    });
});

require.main === module && test.run(console.DEBUG);