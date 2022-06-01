let test = require('test');
test.setup();

let test_util = require('../test_util');

let checkstat = test_util.checkstat;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
test_util.runBIOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;

let now;
var users = {};
var nametest;

describe(`Permission check`, () => {
    let symbol = "AAA";
    let contract = "user1"
    let fibos, ctx, name, name1, name2;
    let precision = 6;
    let connector_symbol = "FO";
    let max_supply = fmt(10000000, precision, symbol);
    let max_exchange = fmt(10000000, precision, symbol);
    let connector_weight = "1.00000000000000000";
    let connector_balance = "0.0000 FO";
    let reserve_supply = fmt(500, precision, symbol);
    let reserve_connector_balance = "10000.0000 FO";

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
            test_util.user(fibos, name);
        }
        name1 = test_util.user(fibos);
        name2 = test_util.user(fibos);
        ctx = fibos.contractSync("eosio.token");

        ctx.createSync("eosio", "50000000.0000 EOS", {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.excreateSync("eosio", `10000000.0000 FO`, 1, `10000000.0000 FO`, `100.0000 FO`, `10000.0000 EOS`, 0, 0, 0, 'eosio', {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
            authorization: "eosio"
        });
        test_util.exchange(fibos, "fibos", `10000000.0000 EOS@eosio`, `0.0000 FO@eosio`, `exchange EOS to FO`)
        let transfer_amount = "80000.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        // checkaccount(fibos, "fibos", "FO", "eosio", null);
    });

    it('excreate parameter issuer', () => {
        assert.throws(() => {
            ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 1, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                authorization: name1
            });
        });
        test_util.checkstat(fibos, name, symbol, contract, null)
    });

    it(`exchange`, () => {
        checkstat(fibos, name, symbol, name, null);
        now = fmtDate();
        let r = ctx.excreateSync(name, max_supply, 1, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
            authorization: name
        });

        assert.throws(() => {
            test_util.exchange(fibos, name, `10000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
        });
    });

    it(`extransfer`, () => {
        assert.throws(() => {
            ctx.extransferSync(name, name2, fmt(100, precision, symbol, name), `transfer 100 ${symbol}@${name}`, {
                authorization: name1
            });
        });
    });

    it(`exunlock`, () => {
        let r = test_util.exchange(fibos, name, `10000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
        assert.equal(r.processed.action_traces[0].console, "");
        ctx.extransferSync(name, name1, fmt(500, precision, symbol, name), `transfer 100 ${symbol}@${name}`, {
            authorization: name
        });

        assert.throws(() => {
            ctx.exunlockSync(name, fmt(100, precision, symbol, name), now, fmt(1000, precision, symbol, name), {
                authorization: name1
            });
        });
    });

    it(`lcktransfer`, () => {
        assert.throws(() => {
            ctx.exlocktransSync(name, name2, fmt(100, precision, symbol, name), now, fmtDate(), `transfer 100 ${symbol}@${name}`, {
                authorization: name1
            });
        });
    });

    it(`exunlock`, () => {
        assert.throws(() => {
            let r = ctx.exunlockSync(name, fmt(50, precision, symbol, name), now, fmt(100, precision, symbol, name), {
                authorization: name1
            });
        });
    });

    it(`exdestroy`, () => {
        assert.throws(() => {
            ctx.exdestroySync(fmt(0, precision, symbol, name), {
                authorization: name1
            });
        });
    });
});

require.main === module && test.run(console.DEBUG);