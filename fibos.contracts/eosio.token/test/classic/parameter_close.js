let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let checkaccount = test_util.checkaccount;
var users = {};


describe(`Parameter Check close classic token`, () => {
    let fibos, ctx, name, name1;
    let symbol1 = "AAA";

    before(() => {
        fibos = test_util.getFIBOS();

        name = test_util.user(fibos, name);
        name1 = test_util.user(fibos, name1);
        ctx = fibos.contractSync("eosio.token");

        ctx.createSync("eosio", "50000000.0000 EOS", {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });

        ctx.createSync("eosio", "1000000000.0000 FO", {
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

        ctx.excreateSync(name, fmt(1000000000, 4, symbol1), 0, fmt(0, 4, symbol1), fmt(0, 4, symbol1), fmt(0, 4, "FO"), fmtDate(), 0, 0, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol1, name), 1, "setposition", {
            authorization: name
        });

        ctx.exissueSync(name, fmt(100, 4, symbol1, name), `issue ${fmt(100, 4, symbol1, name)}`, {
            authorization: name
        });
    });

    it('close asset not zero', () => {
        assert.throws(() => {
            ctx.excloseSync(name, fmt(0, 4, symbol1, name), {
                authorization: name
            });
        });

        assert.throws(() => {
            ctx.excloseSync(name, fmt(0, 4, symbol1, name), {
                authorization: name
            });
        });
    });

    it('close asset not exist', () => {
        let r = ctx.extransferSync(name, name1, fmt(100, 4, symbol1, name), `transfer ${fmt(100, 4, symbol1, name)}`, {
            authorization: name
        });
        assert.equal(r.processed.action_traces[0].console, "");

        assert.throws(() => {
            ctx.excloseSync(name, fmt(0, 4, symbol1, "name123"), {
                authorization: name
            });
        });
    });
});

require.main === module && test.run(console.DEBUG);