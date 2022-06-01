let test = require('test');
test.setup();

let test_util = require('../../test_util');

let checkstat = test_util.checkstat;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let now;

function SmartToken(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(10000, precision, symbol);
        let max_exchange = fmt(8000, precision, symbol);
        let connector_weight = "0.01";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(2000, precision, symbol);
        let reserve_connector_balance = "10.0000 FO";

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
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });

        it(`excreate`, () => {
            checkstat(fibos, name, symbol, name, null);
            now = fmtDate();
            let r = ctx.excreateSync(name, max_supply, 0.01, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            assert.equal(r.processed.action_traces[0].console, "");
        });

        it(`exchange from ${connector_symbol}`, () => {
            let r = test_util.exchange(fibos, name, `1.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");
        });

        it('exunlock', () => {
            ctx = fibos.contractSync("eosio.token");
            assert.throws(() => {
                let r = ctx.exunlockSync(name, fmt(100, precision, symbol, name), 0, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
            });
        });

        it('lcktransfer', () => {
            let r = ctx.exlocktransSync(name, name1, fmt(100, precision, symbol, name), now, fmtDate(), `transfer 100 ${symbol}@${name}`, {
                authorization: name
            });
            assert.equal(r.processed.action_traces[0].console, "");
        });

        it('exunlock by holder', () => {
            ctx = fibos.contractSync("eosio.token");
            assert.throws(() => {
                let r = ctx.exunlockSync(name1, fmt(50, precision, symbol, name), now, fmt(100, precision, symbol, name), {
                    authorization: name1
                });
            });
        });
    });
}


SmartToken('AAA', 'user1', 'FO', 4);

require.main === module && test.run(console.DEBUG);