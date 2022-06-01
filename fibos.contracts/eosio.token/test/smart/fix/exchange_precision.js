const test = require('test');
const coroutine = require('coroutine');

test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let checkstat = test_util.checkstat;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;

SmartToken('AAA', 'user1', 'FO', 4);

function SmartToken(symbol, contract, connector_symbol, precision) {
    describe(`cut out number when exchange`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(30000000000, precision, symbol);
        let max_exchange = fmt(30000000000, precision, symbol);
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(3000000000, precision, symbol);
        let reserve_connector_balance = "90000.0000 FO";

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

            ctx.excreateSync("eosio", `100000000000.0000 FO`, 0, `10000000000.0000 FO`, `5000000000.0000 FO`, `550000.0000 EOS`, 0, 0, 0, 'eosio', {
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
            ctx.issueSync('fibos', `1408102.0000 FO@eosio`, '0.0000 EOS@eosio', {
                authorization: 'eosio'
            });
        });

        it('dust attack exchange should throw', () => {
            var inital_eos_balance = fibos.getTableRowsSync(true, 'eosio.token', 'fibos', 'accounts').rows[0].balance.quantity.split(' ')[0];
            var inital_fo_balance = fibos.getTableRowsSync(true, 'eosio.token', 'fibos', 'accounts').rows[1].balance.quantity.split(' ')[0];
            ctx.exchangeSync("fibos", `0.0001 EOS@eosio`, `0.0000 FO@eosio`, `exchange EOS to FO-0`, {
                authorization: "fibos"
            });

            var fo_balance = fibos.getTableRowsSync(true, 'eosio.token', 'fibos', 'accounts').rows[1].balance.quantity.split(' ')[0];
            var deduction = (parseFloat(fo_balance) - parseFloat(inital_fo_balance)).toFixed(4);
            assert.throws(() => {
                ctx.exchangeSync("fibos", `${deduction - 0.0001} FO@eosio`, `0.0000 EOS@eosio`, `exchange FO to EOS1-1`, {
                    authorization: "fibos"
                });
            });
            fo_balance = fibos.getTableRowsSync(true, 'eosio.token', 'fibos', 'accounts').rows[1].balance.quantity.split(' ')[0];
            eos_balance = fibos.getTableRowsSync(true, 'eosio.token', 'fibos', 'accounts').rows[0].balance.quantity.split(' ')[0];
            assert.notEqual(eos_balance, inital_eos_balance);
        });
    });
}

require.main === module && test.run(console.DEBUG);