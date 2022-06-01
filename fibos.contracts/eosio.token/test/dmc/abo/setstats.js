let test = require('test');
test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
const coroutine = require("coroutine")
var users = {};

describe(`set release tables`, () => {
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

        ctx.excreateSync("eosio", `1000000000.0000 DMC`, `0.0000 DMC`, 0, {
            authorization: "eosio"
        })
    });

    it(`only eosio can set`, () => {
        assert.throws(() => {
            ctx.setabostatsSync(1, 0.3, 0.7, "155520000.0000 DMC@datamall", "2022-01-01T00:00:00", "2022-06-31T23:59:59", {
                authorization: "fibos"
            })
        });
    })

    it(`only DMC@datamall can set`, () => {
        assert.throws(() => {
            ctx.setabostatsSync(1, 0.3, 0.7, "155520000.0000 DMC@eosio", "2022-01-01T00:00:00", "2022-06-31T23:59:59", {
                authorization: "eosio"
            })
        });
    })

    it(`invaild rate`, () => {
        assert.throws(() => {
            ctx.setabostatsSync(1, 1.2, 0.7, "155520000.0000 DMC@datamall", "2022-01-01T00:00:00", "2022-06-31T23:59:59", {
                authorization: "eosio"
            })
        });
        assert.throws(() => {
            ctx.setabostatsSync(1, -0.2, 0.7, "155520000.0000 DMC@datamall", "2022-01-01T00:00:00", "2022-06-31T23:59:59", {
                authorization: "eosio"
            })
        });
        assert.throws(() => {
            ctx.setabostatsSync(1, 0, 0.7, "155520000.0000 DMC@datamall", "2022-01-01T00:00:00", "2022-06-31T23:59:59", {
                authorization: "eosio"
            })
        });
    });

    it(`invaild stage`, () => {
        assert.throws(() => {
            ctx.setabostatsSync(0, 0.3, 0.7, "155520000.0000 DMC@datamall", "2022-01-01T00:00:00", "2022-06-31T23:59:59", {
                authorization: "eosio"
            })
        });
        assert.throws(() => {
            ctx.setabostatsSync(12, 0.3, 0.7, "155520000.0000 DMC@datamall", "2022-01-01T00:00:00", "2022-06-31T23:59:59", {
                authorization: "eosio"
            })
        });
    })

    it(`invaild timestamp`, () => {
        assert.throws(() => {
            ctx.setabostatsSync(11, 0.3, 0.7, "155520000.0000 DMC@datamall", "2022-01-01T00:00:00", "2021-06-31T23:59:59", {
                authorization: "eosio"
            })
        });
    })

    it(`set stage 1`, () => {
        ctx.setabostatsSync(1, 0.3, 0.7, "155520000.0000 DMC@datamall", "2022-01-01T00:00:00", "2022-06-30T23:59:59", {
            authorization: "eosio"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[0];
        delete r.last_released_at;

        assert.deepEqual(r, {
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
    })

    it(`set stage 2`, () => {
        ctx.setabostatsSync(2, 0.4, 0.6, "142560000.0000 DMC@datamall", "2022-07-01T00:00:00", "2022-12-31T23:59:59", {
            authorization: "eosio"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[1];
        delete r.last_released_at;

        assert.deepEqual(r, {
            "stage": 2,
            "user_rate": "0.40000000000000002",
            "foundation_rate": "0.59999999999999998",
            "total_release": {
                "quantity": "142560000.0000 DMC",
                "contract": "datamall"
            },
            "remaining_release": {
                "quantity": "142560000.0000 DMC",
                "contract": "datamall"
            },
            "start_at": "2022-07-01T00:00:00",
            "end_at": "2022-12-31T23:59:59"
        })
    })

    it(`set stage 3`, () => {
        ctx.setabostatsSync(3, 0.5, 0.5, "125280000.0000 DMC@datamall", "2023-01-01T00:00:00", "2023-06-30T23:59:59", {
            authorization: "eosio"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[2];
        delete r.last_released_at;

        assert.deepEqual(r, {
            "stage": 3,
            "user_rate": "0.50000000000000000",
            "foundation_rate": "0.50000000000000000",
            "total_release": {
                "quantity": "125280000.0000 DMC",
                "contract": "datamall"
            },
            "remaining_release": {
                "quantity": "125280000.0000 DMC",
                "contract": "datamall"
            },
            "start_at": "2023-01-01T00:00:00",
            "end_at": "2023-06-30T23:59:59"
        })
    })

    it(`set stage 4`, () => {
        ctx.setabostatsSync(4, 0.55, 0.45, "93960000.0000 DMC@datamall", "2023-07-01T00:00:00", "2023-12-31T23:59:59", {
            authorization: "eosio"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[3];
        delete r.last_released_at;

        assert.deepEqual(r, {
            "stage": 4,
            "user_rate": "0.55000000000000004",
            "foundation_rate": "0.45000000000000001",
            "total_release": {
                "quantity": "93960000.0000 DMC",
                "contract": "datamall"
            },
            "remaining_release": {
                "quantity": "93960000.0000 DMC",
                "contract": "datamall"
            },
            "start_at": "2023-07-01T00:00:00",
            "end_at": "2023-12-31T23:59:59"
        })
    })

    it(`set stage 5`, () => {
        ctx.setabostatsSync(5, 0.6, 0.4, "70470000.0000 DMC@datamall", "2024-01-01T00:00:00", "2024-06-30T23:59:59", {
            authorization: "eosio"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[4];
        delete r.last_released_at;

        assert.deepEqual(r, {
            "stage": 5,
            "user_rate": "0.59999999999999998",
            "foundation_rate": "0.40000000000000002",
            "total_release": {
                "quantity": "70470000.0000 DMC",
                "contract": "datamall"
            },
            "remaining_release": {
                "quantity": "70470000.0000 DMC",
                "contract": "datamall"
            },
            "start_at": "2024-01-01T00:00:00",
            "end_at": "2024-06-30T23:59:59"
        })
    })


    it(`set stage 6`, () => {
        ctx.setabostatsSync(6, 0.7, 0.3, "52852500.0000 DMC@datamall", "2024-07-01T00:00:00", "2024-12-31T23:59:59", {
            authorization: "eosio"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[5];
        delete r.last_released_at;

        assert.deepEqual(r, {
            "stage": 6,
            "user_rate": "0.69999999999999996",
            "foundation_rate": "0.29999999999999999",
            "total_release": {
                "quantity": "52852500.0000 DMC",
                "contract": "datamall"
            },
            "remaining_release": {
                "quantity": "52852500.0000 DMC",
                "contract": "datamall"
            },
            "start_at": "2024-07-01T00:00:00",
            "end_at": "2024-12-31T23:59:59"
        })
    })

    it(`set stage 7`, () => {
        ctx.setabostatsSync(7, 0.75, 0.25, "118918125.0000 DMC@datamall", "2025-01-01T00:00:00", "2026-06-30T23:59:59", {
            authorization: "eosio"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[6];
        delete r.last_released_at;

        assert.deepEqual(r, {
            "stage": 7,
            "user_rate": "0.75000000000000000",
            "foundation_rate": "0.25000000000000000",
            "total_release": {
                "quantity": "118918125.0000 DMC",
                "contract": "datamall"
            },
            "remaining_release": {
                "quantity": "118918125.0000 DMC",
                "contract": "datamall"
            },
            "start_at": "2025-01-01T00:00:00",
            "end_at": "2026-06-30T23:59:59"
        })
    })

    it(`set stage 8`, () => {
        ctx.setabostatsSync(8, 0.8, 0.2, "89188593.7500 DMC@datamall", "2026-07-01T00:00:00", "2027-12-31T23:59:59", {
            authorization: "eosio"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[7];
        delete r.last_released_at;

        assert.deepEqual(r, {
            "stage": 8,
            "user_rate": "0.80000000000000004",
            "foundation_rate": "0.20000000000000001",
            "total_release": {
                "quantity": "89188593.7500 DMC",
                "contract": "datamall"
            },
            "remaining_release": {
                "quantity": "89188593.7500 DMC",
                "contract": "datamall"
            },
            "start_at": "2026-07-01T00:00:00",
            "end_at": "2027-12-31T23:59:59"
        })
    })

    it(`set stage 9`, () => {
        ctx.setabostatsSync(9, 0.9, 0.1, "66891445.3100 DMC@datamall", "2028-01-01T00:00:00", "2029-06-30T23:59:59", {
            authorization: "eosio"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[8];
        delete r.last_released_at;

        assert.deepEqual(r, {
            "stage": 9,
            "user_rate": "0.90000000000000002",
            "foundation_rate": "0.10000000000000001",
            "total_release": {
                "quantity": "66891445.3100 DMC",
                "contract": "datamall"
            },
            "remaining_release": {
                "quantity": "66891445.3100 DMC",
                "contract": "datamall"
            },
            "start_at": "2028-01-01T00:00:00",
            "end_at": "2029-06-30T23:59:59"
        })
    })

    it(`set stage 10`, () => {
        ctx.setabostatsSync(10, 0.95, 0.05, "50168583.9800 DMC@datamall", "2029-07-01T00:00:00", "2030-12-31T23:59:59", {
            authorization: "eosio"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[9];
        delete r.last_released_at;

        assert.deepEqual(r, {
            "stage": 10,
            "user_rate": "0.94999999999999996",
            "foundation_rate": "0.05000000000000000",
            "total_release": {
                "quantity": "50168583.9800 DMC",
                "contract": "datamall"
            },
            "remaining_release": {
                "quantity": "50168583.9800 DMC",
                "contract": "datamall"
            },
            "start_at": "2029-07-01T00:00:00",
            "end_at": "2030-12-31T23:59:59"
        })
    })

    it(`set stage 11`, () => {
        ctx.setabostatsSync(11, 0.95, 0.05, "34190751.9500 DMC@datamall", "2031-01-01T00:00:00", "2032-06-30T23:59:59", {
            authorization: "eosio"
        })
        let r = fibos.getTableRowsSync({ "json": true, "code": "eosio.token", "scope": "eosio.token", "table": "abostats", "limit": 50 }).rows[10];
        delete r.last_released_at;

        assert.deepEqual(r, {
            "stage": 11,
            "user_rate": "0.94999999999999996",
            "foundation_rate": "0.05000000000000000",
            "total_release": {
                "quantity": "34190751.9500 DMC",
                "contract": "datamall"
            },
            "remaining_release": {
                "quantity": "34190751.9500 DMC",
                "contract": "datamall"
            },
            "start_at": "2031-01-01T00:00:00",
            "end_at": "2032-06-30T23:59:59"
        })
    })

    it(`check all stage`, () => {
        let r = fibos.getTableRowsSync({ "json": true, "code": "eosio.token", "scope": "eosio.token", "table": "abostats", "limit": 50 }).rows;
        console.warn('---- r ----', r);
    })

    it(`modify stage 1`, () => {
        ctx.setabostatsSync(1, 0.95, 0.05, "50168583.9800 DMC@datamall", "2029-07-01T00:00:00", "2030-12-31T23:59:59", {
            authorization: "eosio"
        })
        let r = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "abostats").rows[0];
        delete r.last_released_at;

        assert.deepEqual(r, {
            "stage": 1,
            "user_rate": "0.94999999999999996",
            "foundation_rate": "0.05000000000000000",
            "total_release": {
                "quantity": "50168583.9800 DMC",
                "contract": "datamall"
            },
            "remaining_release": {
                "quantity": "155520000.0000 DMC",
                "contract": "datamall"
            },
            "start_at": "2029-07-01T00:00:00",
            "end_at": "2030-12-31T23:59:59"
        })
    })
});

require.main === module && test.run(console.DEBUG);