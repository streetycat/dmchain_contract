let test = require('test');
test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let checkaccount = test_util.checkaccount;
const coroutine = require("coroutine")
var users = {};

describe(`stake, only m = 2`, () => {
    let symbol = "FORK";
    let contract = "user1"
    let fibos, ctx, name, name1;

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
            test_util.user(fibos, name);
        }
        name1 = test_util.user(fibos);
        ctx = fibos.contractSync("eosio.token");

        ctx.excreateSync("datamall", `1000000000 PST`, `0 PST`, 0, {
            authorization: "datamall"
        })
        ctx.excreateSync("datamall", `1000000000.00000000 RSI`, `0.00000000 RSI`, 0, {
            authorization: "datamall"
        })

    });
    after(() => {
        test_util.stop()
    })


    it(`success, stake 100 PST`, () => {
        ctx.exissueSync("fibos", `100 PST@datamall`, `issue 50 PST`, {
            authorization: "datamall"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "datamall", "stats").rows[1], {
            "supply": "100 PST",
            "max_supply": "1000000000 PST",
            "issuer": "datamall",
            "reserve_supply": "0 PST"
        });
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "100 PST",
            "contract": "datamall"
        });
        ctx.billSync("fibos", "100 PST@datamall", 1, "test", {
            authorization: "fibos"
        });
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "0 PST",
            "contract": "datamall"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows[0].unmatched, {
            "quantity": "100 PST",
            "contract": "datamall"
        });
    })

    it(`getincentive`, () => {
        let r = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        let bill_id = r[0].bill_id;
        coroutine.sleep(1000);
        ctx.getincentiveSync("fibos", bill_id, {
            authorization: "fibos"
        })
        checkaccount(fibos, "fibos", "RSI", "datamall", {
            "quantity": "0.00033000 RSI", // or 4100
            "contract": "datamall"
        });
        r = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
    })
});

require.main === module && test.run(console.DEBUG);