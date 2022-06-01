let test = require('test');
test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
var users = {};

describe(`allocation`, () => {
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

        ctx.excreateSync("datamall", `1000000000.0000 DMC`, `0.0000 DMC`, 0, {
            authorization: "datamall"
        })

        ctx.setabostatsSync(1, 0.3, 0.7, "155520000.0000 DMC@datamall", "2022-01-01T00:00:00", "2022-06-30T23:59:59", {
            authorization: "eosio"
        })
        let rows = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[0];
        delete rows.last_released_at;
        assert.deepEqual(rows, {
            "stage": 1,
            "user_rate": "0.29999999999999999",
            "foundation_rate": "0.69999999999999996",
            "total_release": {
                "quantity": "155520000.0000 DMC",
                "contract": "datamall"
            },
            "remaining_release": {
                "quantity": "155520000.0000 DMC",
                "contract": "datamall"
            },
            "start_at": "2022-01-01T00:00:00",
            "end_at": "2022-06-30T23:59:59"
        })
    });

    it(`only eosio can allocation`, () => {
        assert.throws(() => {
            ctx.allocationSync("test", {
                authorization: "fibos"
            })
        });
    })

    let issue_amount = 0;
    it(`allocation`, () => {
        let u = fibos.getTableRowsSync(true, "eosio.token", "datamall", "accounts").rows;
        assert.deepEqual(u.length, 0);
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[0];
        let remaining_release = parseFloat(r.remaining_release.quantity.split(" ")[0]);
        let ar = ctx.allocationSync("test2", {
            authorization: "eosio"
        })
        r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[0];
        let remaining_release2 = parseFloat(r.remaining_release.quantity.split(" ")[0]);
        issue_amount = remaining_release - remaining_release2;
        let data_accounts = fibos.getTableRowsSync(true, "eosio.token", "datamall", "accounts").rows[0];
        assert.deepEqual(data_accounts, {
            "primary": 0,
            "balance": {
                "quantity": `${(issue_amount * 0.7).toFixed(5).slice(0, -1)} DMC`,
                "contract": "datamall"
            }
        });
        let dmfoundation_accoutns = fibos.getTableRowsSync(true, "eosio.token", "dmfoundation", "accounts").rows[0];
        assert.deepEqual(dmfoundation_accoutns, {
            "primary": 0,
            "balance": {
                "quantity": `${(issue_amount * 0.3).toFixed(5).slice(0, -1)} DMC`,
                "contract": "datamall"
            }
        });
    })

    it(`cannot be allocation within 24 hours`, () => {
        ctx.allocationSync("test3", {
            authorization: "eosio"
        })
        let data_accounts = fibos.getTableRowsSync(true, "eosio.token", "datamall", "accounts").rows[0];
        assert.deepEqual(data_accounts, {
            "primary": 0,
            "balance": {
                "quantity": `${(issue_amount * 0.7).toFixed(5).slice(0, -1)} DMC`,
                "contract": "datamall"
            }
        });
        let dmfoundation_accoutns = fibos.getTableRowsSync(true, "eosio.token", "dmfoundation", "accounts").rows[0];
        assert.deepEqual(dmfoundation_accoutns, {
            "primary": 0,
            "balance": {
                "quantity": `${(issue_amount * 0.3).toFixed(5).slice(0, -1)} DMC`,
                "contract": "datamall"
            }
        });
    })
});

require.main === module && test.run(console.DEBUG);