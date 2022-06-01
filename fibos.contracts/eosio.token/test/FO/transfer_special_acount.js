let test = require('test');
test.setup();

let test_util = require('../test_util');

let checkaccount = test_util.checkaccount;
let fibos
let fmt = test_util.fmt;
let ctx, name;

let accounts = ["eosio.saving", "eosio.ramfee"];


describe("Test Transfer to special account", () => {
    Transfer("eosio.saving");
    Transfer("eosio.ramfee");
});

function Transfer(account) {
    test_util.runBIOS();

    describe(`transfer to ${account}, balance would be retire`, () => {

        before(() => {
            fibos = test_util.getFIBOS();

            accounts.forEach(a => {
                if (a === 'eosio.ramfee') return;
                test_util.user(fibos, a);
            });

            name = test_util.user(fibos);

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
            ctx.issueSync("fibos", `1000000.0000 FO`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            let transfer_amount = "1000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `extransfer to `, {
                authorization: "fibos"
            });
        });

        it(`test`, () => {
            checkaccount(fibos, "fibos", "FO", "eosio", {
                "quantity": fmt(999000.0000, 4, "FO"),
                "contract": "eosio"
            });
            checkaccount(fibos, account, "FO", "eosio", null);

            ctx.extransferSync(name, account, `1000.0000 FO@eosio`, `transfer to ${account}`, {
                authorization: name
            });

            checkaccount(fibos, account, "FO", "eosio", null);
            checkaccount(fibos, "fibos", "FO", "eosio", {
                "quantity": fmt(999000.0000, 4, "FO"),
                "contract": "eosio"
            });
        });
    });
}

require.main === module && test.run(console.DEBUG);