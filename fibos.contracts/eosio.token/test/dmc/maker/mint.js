let test = require('test');
test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let checkaccount = test_util.checkaccount;
let chekcpststats = test_util.chekcpststats;
const coroutine = require("coroutine");
const { checkstat } = require('../../test_util');
var users = {};

describe(`mint`, () => {
    let contract = "user1"
    let fibos, ctx, name, name1, name2;

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
            test_util.user(fibos, name);
        }
        name1 = test_util.user(fibos);
        name2 = test_util.user(fibos);
        ctx = fibos.contractSync("eosio.token");

        ctx.excreateSync("datamall", `1000000000 PST`, `0 PST`, 0, {
            authorization: "datamall"
        })
        ctx.excreateSync("datamall", `1000000000.0000 DMC`, `0.0000 DMC`, 0, {
            authorization: "datamall"
        })
        ctx.excreateSync("eosio", `1000000000.0000 DMC`, `0.0000 DMC`, 0, {
            authorization: "eosio"
        })
        ctx.excreateSync("datamall", `1000000000.00000000 RSI`, `0.00000000 RSI`, 0, {
            authorization: "datamall"
        })
        ctx.exissueSync("fibos", `1000.0000 DMC@eosio`, `issue 1000 DMC`, {
            authorization: "eosio"
        });
    });

    after(() => {
        require.main === module && test_util.stop();
    });

    it(`maker`, () => {
        ctx.exissueSync("fibos", `1000.0000 DMC@datamall`, `issue 1000 DMC`, {
            authorization: "datamall"
        });
        ctx.increaseSync("fibos", "1.0000 DMC@datamall", "fibos", {
            authorization: "fibos"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner, "fibos");
        assert.deepEqual(r[0].total_staked, {
            "quantity": "1.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].miner_staked, {
            "quantity": "1.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].lps_staked, {
            "quantity": "0.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].lps, []);
        checkaccount(fibos, "fibos", "DMC", "datamall", {
            "quantity": "999.0000 DMC",
            "contract": "datamall"
        })
    })

    it(`mint, invaild asset`, () => {
        assert.throws(() => {
            ctx.mintSync("fibos", "1.00 PST@datamall", {
                authorization: "fibos"
            })
        });
        assert.throws(() => {
            ctx.mintSync("fibos", "1.00 PST@eosio", {
                authorization: "fibos"
            })
        });
        assert.throws(() => {
            ctx.mintSync("fibos", "-1 PST@datamall", {
                authorization: "fibos"
            })
        });
    })

    it(`mint, no such record`, () => {
        assert.throws(() => {
            ctx.mintSync(name1, "1 PST@datamall", 1, {
                authorization: name1
            })
        });
    })


    let price;
    let canminted;
    it(`bill and order`, () => {
        ctx.exissueSync("fibos", `1000 PST@datamall`, `issue 1000 PST`, {
            authorization: "datamall"
        });
        ctx.billSync("fibos", "100 PST@datamall", 0.0007, "test", {
            authorization: "fibos"
        });
        let s = fibos.getTableRowsSync(true, "eosio.token", "fibos", "stakerec").rows;
        let bill_id = s[0].bill_id;
        ctx.orderSync("fibos", "fibos", bill_id, "5 PST@datamall", "test", {
            authorization: "fibos"
        })
        let p = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcprice").rows;
        price = p[0].price;
        assert.deepEqual(price, "0.00069999997504056");
        chekcpststats(fibos, "fibos", {
            "quantity": "1000 PST",
            "contract": "datamall"
        });
    })

    it(`mint`, () => {
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "900 PST",
            "contract": "datamall"
        })
        ctx.mintSync("fibos", "1000 PST@datamall", {
            authorization: "fibos"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner, "fibos");

        assert.deepEqual(r[0].total_staked, {
            "quantity": "1.0000 DMC",
            "contract": "datamall"
        });
        canminted = parseInt(r[0].total_staked.quantity.split(".")[0]) / (price * 0.25);
        assert.deepEqual(canminted, 5714.285918036252);

        assert.deepEqual(r[0].miner_staked, {
            "quantity": "1.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].lps_staked, {
            "quantity": "0.0000 DMC",
            "contract": "datamall"
        });
        assert.deepEqual(r[0].lps, []);
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "1900 PST",
            "contract": "datamall"
        })
        chekcpststats(fibos, "fibos", {
            "quantity": "2000 PST",
            "contract": "datamall"
        });
    })

    it(`mint, insufficient funds to mint`, () => {
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "1900 PST",
            "contract": "datamall"
        })
        assert.throws(() => {
            ctx.mintSync("fibos", "5000 PST@datamall", {
                authorization: "fibos"
            })
        });
    })

    it(`mint, test floor`, () => {
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "1900 PST",
            "contract": "datamall"
        })
        assert.throws(() => {
            ctx.mintSync("fibos", "3715 PST@datamall", {
                authorization: "fibos"
            })
        });
    })

    it(`mint all`, () => {
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "1900 PST",
            "contract": "datamall"
        })
        chekcpststats(fibos, "fibos", {
            "quantity": "2000 PST",
            "contract": "datamall"
        });
        ctx.mintSync("fibos", "3714 PST@datamall", {
            authorization: "fibos"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker").rows;
        assert.deepEqual(r[0].miner, "fibos");
        checkaccount(fibos, "fibos", "PST", "datamall", {
            "quantity": "5614 PST",
            "contract": "datamall"
        })
        let rs = fibos.getTableRowsSync(true, "eosio.token", "datamall", "stats")
        assert.deepEqual(rs.rows[2], {
            "supply": "5714 PST",
            "max_supply": "1000000000 PST",
            "issuer": "datamall",
            "reserve_supply": "0 PST"
        })
        chekcpststats(fibos, "fibos", {
            "quantity": "5714 PST",
            "contract": "datamall"
        });
    })
});

require.main === module && test.run(console.DEBUG);