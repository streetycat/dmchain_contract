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

SmartToken('AAA', 'user1', 'FO', 4);
SmartToken('BBB', 'user2', 'FO', 6);
SmartToken('CCC', 'user3', 'FO', 8);

let firstloaded = true;
function SmartToken(symbol, contract, connector_symbol, precision) {
    describe(`Mismatch symbol precision: ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(10000000, precision, symbol);
        let max_exchange = fmt(10000000, precision, symbol);
        let connector_weight = "1.00000000000000000";
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

            if (firstloaded) {
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
                firstloaded = false;
            }
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
            ctx.excreateSync(name, max_supply, 1, max_exchange, reserve_supply, reserve_connector_balance, fmtDate(), 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            test_util.exchange(fibos, name, `10000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
        });

        it(`exchange owner`, () => {
            assert.throws(() => {
                test_util.exchange(fibos, name, `10000.0000 ${connector_symbol}@eosio`, fmt(0, precision + 1, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            });
        });
    });
}

require.main === module && test.run(console.DEBUG);