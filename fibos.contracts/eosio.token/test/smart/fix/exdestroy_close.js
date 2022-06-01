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
let fmtDate = test_util.fmtDate;

SmartToken('AAA', 'user1', 'FO', 4);

function SmartToken(symbol, contract, connector_symbol, precision) {
    describe(`cut out number when exchange`, () => {
        let ctx, name, name1;

        before(() => {
            name = contract;
            if (name !== 'eosio' && name !== 'fibos') {
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

            ctx.excreateSync("eosio", `100000000000.0000 FO`, 0, `10000000000.0000 FO`, `5000000000.0000 FO`, `550000.0000 EOS`, 0, 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });

            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            //----------------------------------
            let r = ctx.excreateSync(name, `1000.0000 ${symbol}`, 0, `1000.0000 ${symbol}`, `100.0000 ${symbol}`, `100.0000 FO`, fmtDate(), 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });

            ctx.exissueSync(name1, `100.0000 ${symbol}@${name}`, ``, {
                authorization: name
            });

            ctx.extransferSync(name1, name, `100.0000 ${symbol}@${name}`, ``, {
                authorization: name1
            });
            checkaccount(fibos, name1, symbol, name, {
                "quantity": fmt(0, precision, symbol),
                "contract": name
            });

            ctx.exdestroySync(fmt(0, precision, symbol, name), {
                authorization: name
            });
            assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", name, "stats"), {
                "rows": [],
                "more": false
            });
        });

        it('create again', () => {

            let r = ctx.excreateSync(name, `1000.000000 ${symbol}`, 0, `1000.000000 ${symbol}`, `100.000000 ${symbol}`, `100.0000 FO`, fmtDate(), 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });

            try {
                ctx.exissueSync(name1, `100.000000 ${symbol}@${name}`, ``, {
                    authorization: name
                });
            } catch (e) {
                let reslut = JSON.parse(e);
                assert.equal(reslut.code, 500);
                assert.equal(reslut.error.details[0].message, "assertion failure with message: attempt to add asset with different symbol");
                assert.equal(reslut.error.details[0].line_number, 930);
            }

        });
    });
}

require.main === module && test.run(console.DEBUG);