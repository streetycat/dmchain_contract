let test = require('test');
test.setup();

let test_util = require('../test_util');

let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
test_util.runBIOS();

var users = {};

describe(`Permission check`, () => {
    let symbol = "AAA";
    let contract = "user1"
    let fibos, ctx, name, name1;

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
            test_util.user(fibos, name);
        }
        name = test_util.user(fibos);
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
        let transfer_amount = "80000.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
    });

    it('excreate parameter issuer', () => {
        assert.throws(() => {
            ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 1, `100.0000 ${symbol}`, `100.0000 ${symbol}`, '200.0000 FO', fmtDate(), 0, 0, 'eosio', {
                authorization: name1
            });
        });
        test_util.checkstat(fibos, name, symbol, contract, null)
    });
});

require.main === module && test.run(console.DEBUG);