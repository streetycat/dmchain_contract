let test = require('test');
test.setup();
let fs = require("fs")
let test_util = require('./test_util');

let checkaccount = test_util.checkaccount;
let fibos = test_util.getFIBOS();
const coroutine = require('coroutine');
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let contract = "fibos";

test_util.runBIOS();

describe(`Parameter check extransfer abo args`, () => {
    let symbol_fo = "FO";
    let name = "user1";
    let precision = 4;
    let ctx;

    let max_supply_fo = fmt(10000000, precision, symbol_fo);
    let reserve_supply_fo = fmt(100, precision, symbol_fo);

    before(() => {
        fund = 'fibos';
        if (name !== 'eosio' && name !== 'fibos') {
            test_util.user(fibos, name);
            fund = contract;
        }
        ctx = fibos.contractSync("eosio.token");
        ctx.createSync("datamall", "50000000.0000 EOS", {
            authorization: "datamall"
        });
        ctx.excreateSync("datamall", max_supply_fo, reserve_supply_fo, 0, {
            authorization: "datamall"
        });
        ctx.issueSync(name, `10000000.0000 EOS`, `issue 100.0000 EOS`, {
            authorization: "datamall"
        });
        ctx.issueSync(name, `100000.0000 FO`, `issue 100.0000 FO`, {
            authorization: "datamall"
        });
    });

    it(`empty memo`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fibosabo", "100.0000 EOS@datamall", "", {
                authorization: name
            });
        });
    });


    it(`invaild memo`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fibosabo", "100.0000 EOS@datamall", ";FO@datamall", {
                authorization: name
            });
        });
        assert.throws(() => {
            ctx.transferSync(name, "fibosabo", "100.0000 EOS@datamall", "1642870861;,FO@datamall", {
                authorization: name
            });
        });
        assert.throws(() => {
            ctx.transferSync(name, "fibosabo", "100.0000 EOS@datamall", "1642870861;", {
                authorization: name
            });
        });
    })

    it(`no such memo' token`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fibosabo", "100.0000 EOS@datamall", "1642870861;abo@datamall", {
                authorization: name
            });
        });
    })

    it(`no such market`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fibosabo", "100.0000 EOS@datamall", "1642870861;EOS@datamall", {
                authorization: name
            });
        });
    })

    it(`create uniswap market`, () => {
        ctx.addreservesSync(name, "1000.0000 EOS@datamall", "1000.0000 FO@datamall", {
            authorization: name
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "swapmarket").rows[0], {
            "primary": 0,
            "tokenx": {
                "quantity": "1000.0000 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "1000.0000 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        });
    });

    it(`expiration must longer than now`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fibosabo", "100.0000 EOS@datamall", "1342870861;EOS@datamall", {
                authorization: name
            });
        });
    });

    it(`normal transfer`, () => {
        ctx.transferSync(name, "fibosabo", "100.0000 EOS@datamall", "1642870861;FO@datamall", {
            authorization: name
        });
        ctx.transferSync(name, "fibosabo", "300.0000 EOS@datamall", "1642870862;FO@datamall", {
            authorization: name
        });
        ctx.transferSync(name, "fibosabo", "400.0000 EOS@datamall", "1642870863;FO@datamall", {
            authorization: name
        });
        ctx.transferSync(name, "fibosabo", "500.0000 EOS@datamall", "1642870864;FO@datamall", {
            authorization: name
        });
        let result = fibos.getTableRowsSync(true, "fibosabo", "fibosabo", "repospool")
        console.warn('---- result ----', result);
    })

    it(`normal extransfer`, () => {
        ctx.extransferSync(name, "fibosabo", "200.0000 EOS@datamall", `${fmtDate(2)};FO@datamall`, {
            authorization: name
        });
    })

    it(`Not executed should throw`, () => {
        checkaccount(fibos, "fibosabo", "FO", "datamall", null);
        coroutine.sleep(2000);
        ctx = fibos.contractSync("fibosabo");
        assert.throws(() => {
            ctx.repurchaseSync(name, 0, {
                authorization: name
            })
        });
    })
});
require.main === module && test.run(console.DEBUG);
