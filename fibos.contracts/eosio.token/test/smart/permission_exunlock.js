let test = require('test');
test.setup();

let test_util = require('../test_util');

let checkstat = test_util.checkstat;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
test_util.runBIOS();
let fmt = test_util.fmt;

var users = {};
var nametest;

describe(`Permission check exunlock`, () => {
    let symbol = "AAA";
    let contract = "user1"
    let fibos, ctx, name, name1;
    let precision = 6;

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
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
    });

    it(`exunlock permission`, () => {
        assert.throws(() => {
            ctx.exunlockSync(name, fmt(50, precision, symbol, name), 0, fmt(100, precision, symbol, name), {
                authorization: name1
            });
        });
    });
});

require.main === module && test.run(console.DEBUG);