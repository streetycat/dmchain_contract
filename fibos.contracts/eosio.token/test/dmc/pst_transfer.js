let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
var users = {};

describe(`PST can only be issued, not transfer`, () => {
    let contract = "user1"
    let fibos, ctx, name;

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
        ctx.excreateSync("eosio", `1000000000 PST`, `0 PST`, 0, {
            authorization: "eosio"
        })
    });

    it(`pst can issued`, () => {
        ctx.exissueSync("fibos", `10000 PST@datamall`, `issue 50 PST`, {
            authorization: "datamall"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "datamall", "stats").rows[0], {
            "supply": "10000 PST",
            "max_supply": "1000000000 PST",
            "issuer": "datamall",
            "reserve_supply": "0 PST"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "fibos", "accounts").rows[0], {
            "primary": 0,
            "balance": {
                "quantity": "10000 PST",
                "contract": "datamall"
            }
        })
    })

    it(`pst can't transfer except datamall`, () => {
        assert.throws(() => {
            ctx.extransferSync("fibos", name, `100 PST@datamall`, `extransfer pst`, {
                authorization: "fibos"
            });
        });
    })

    it(`issue to datamall`, () => {
        ctx.exissueSync("datamall", `10000 PST@datamall`, `issue 50 PST`, {
            authorization: "datamall"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "datamall", "stats").rows[0], {
            "supply": "20000 PST",
            "max_supply": "1000000000 PST",
            "issuer": "datamall",
            "reserve_supply": "0 PST"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "datamall", "accounts").rows[0], {
            "primary": 0,
            "balance": {
                "quantity": "10000 PST",
                "contract": "datamall"
            }
        })
    })

    it(`datamall transfer PST to other person`, () => {
        ctx.extransferSync("datamall", "fibos", `1000 PST@datamall`, `extransfer pst`, {
            authorization: "datamall"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "datamall", "accounts").rows[0], {
            "primary": 0,
            "balance": {
                "quantity": "9000 PST",
                "contract": "datamall"
            }
        })
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "fibos", "accounts").rows[0], {
            "primary": 0,
            "balance": {
                "quantity": "11000 PST",
                "contract": "datamall"
            }
        })
    })

    it(`check pststats`, () => {
        assert.deepEqual(fibos.getTableRowsSync({
            json: true,
            code: "eosio.token",
            scope: "eosio.token",
            table: "pststats",
        }).rows, [
            {
                "owner": "datamall",
                "amount": {
                    "quantity": "10000 PST",
                    "contract": "datamall"
                }
            },
            {
                "owner": "fibos",
                "amount": {
                    "quantity": "10000 PST",
                    "contract": "datamall"
                }
            }
        ])
    })

    it(`other PST(PST@eosio), can extransfer`, () => {
        ctx.exissueSync("fibos", `10000 PST@eosio`, `issue 10000 PST@eosio`, {
            authorization: "eosio"
        });
        ctx.extransferSync("fibos", "datamall", `1000 PST@eosio`, `extransfer pst`, {
            authorization: "fibos"
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "datamall", "accounts").rows[1], {
            "primary": 1,
            "balance": {
                "quantity": "1000 PST",
                "contract": "eosio"
            }
        })
    })

    it(`pststats does not change`, () => {
        assert.deepEqual(fibos.getTableRowsSync({
            json: true,
            code: "eosio.token",
            scope: "eosio.token",
            table: "pststats",
        }).rows, [
            {
                "owner": "datamall",
                "amount": {
                    "quantity": "10000 PST",
                    "contract": "datamall"
                }
            },
            {
                "owner": "fibos",
                "amount": {
                    "quantity": "10000 PST",
                    "contract": "datamall"
                }
            }
        ])
    })

    it(`exretire will sub pst amoung`, () => {
        ctx.exretireSync("fibos", `1000 PST@datamall`, `exretire 1000 PST@eosio`, {
            authorization: "fibos"
        });
        assert.deepEqual(fibos.getTableRowsSync({
            json: true,
            code: "eosio.token",
            scope: "eosio.token",
            table: "pststats",
        }).rows, [
            {
                "owner": "datamall",
                "amount": {
                    "quantity": "10000 PST",
                    "contract": "datamall"
                }
            },
            {
                "owner": "fibos",
                "amount": {
                    "quantity": "9000 PST",
                    "contract": "datamall"
                }
            }
        ])
    })

    it(`pst can not lock`, () => {
        assert.throws(() => {
            ctx.exlockSync("datamall", `1000 PST@datamall`, 0, `lock pst`, {
                authorization: "datamall"
            });
        });
    })
});

require.main === module && test.run(console.DEBUG);