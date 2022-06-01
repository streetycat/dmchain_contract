let test = require('test');
test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let checkaccount = test_util.checkaccount;
let checkunswapmarket = test_util.checkunswapmarket;
let checkstat = test_util.checkstat;
var users = {};

describe(`uniswap addreserves and outreserves`, () => {
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
        ctx.createSync("datamall", "10000000000.0000 DMC", {
            authorization: "datamall"
        });
        ctx.createSync("datamall", "10000000000.00000000 RSI", {
            authorization: "datamall"
        })

    });

    it(`check datamall accounts`, () => {
        checkaccount(fibos, "datamall", "PST", "datamall", null);
        checkaccount(fibos, "datamall", "RSI", "datamall", null);
    })

    it(`check stats`, () => {
        checkstat(fibos, "datamall", "RSI", "datamall", {
            "supply": "0.00000000 RSI",
            "max_supply": "10000000000.00000000 RSI",
            "issuer": "datamall",
            "reserve_supply": "0.00000000 RSI"
        });
        checkstat(fibos, "datamall", "DMC", "datamall", {
            "supply": "0.0000 DMC",
            "max_supply": "10000000000.0000 DMC",
            "issuer": "datamall",
            "reserve_supply": "0.0000 DMC"
        });
    })

    it(`add reserves`, () => {
        ctx.addreservesSync("datamall", "3114573.8966 DMC@datamall", "448498.64111085 RSI@datamall", {
            authorization: "datamall"
        });
        checkunswapmarket(fibos, "DMC@datamall", "RSI@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "448498.64111085 RSI",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "3114573.8966 DMC",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })

        checkaccount(fibos, "datamall", "PST", "datamall", null);
        checkaccount(fibos, "datamall", "RSI", "datamall", null);

        checkstat(fibos, "datamall", "RSI", "datamall", {
            "supply": "448498.64111085 RSI",
            "max_supply": "10000000000.00000000 RSI",
            "issuer": "datamall",
            "reserve_supply": "0.00000000 RSI"
        });
        checkstat(fibos, "datamall", "DMC", "datamall", {
            "supply": "3114573.8966 DMC",
            "max_supply": "10000000000.0000 DMC",
            "issuer": "datamall",
            "reserve_supply": "0.0000 DMC"
        });
    })

    it(`other people can't`, () => {
        assert.throws(() => {
            ctx.addreservesSync("fibos", "3114573.8966 DMC@datamall", "448498.64111085 RSI@datamall", {
                authorization: "fibos"
            });
        });
    })


    it(`datamall out reserves`, () => {
        ctx.outreservesSync("datamall", "0.0000 DMC@datamall", "0.00000000 RSI@datamall", 1, {
            authorization: "datamall"
        });
        checkaccount(fibos, "datamall", "PST", "datamall", null);
        checkaccount(fibos, "datamall", "RSI", "datamall", null);
        checkunswapmarket(fibos, "DMC@datamall", "RSI@datamall", null)

        checkstat(fibos, "datamall", "RSI", "datamall", {
            "supply": "0.00000000 RSI",
            "max_supply": "10000000000.00000000 RSI",
            "issuer": "datamall",
            "reserve_supply": "0.00000000 RSI"
        });
        checkstat(fibos, "datamall", "DMC", "datamall", {
            "supply": "0.0000 DMC",
            "max_supply": "10000000000.0000 DMC",
            "issuer": "datamall",
            "reserve_supply": "0.0000 DMC"
        });
    })

    it(`add reserves exchange position`, () => {
        ctx.addreservesSync("datamall", "448498.64111085 RSI@datamall", "3114573.8966 DMC@datamall", {
            authorization: "datamall"
        });
        checkunswapmarket(fibos, "DMC@datamall", "RSI@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "448498.64111085 RSI",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "3114573.8966 DMC",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })

        checkaccount(fibos, "datamall", "PST", "datamall", null);
        checkaccount(fibos, "datamall", "RSI", "datamall", null);

        checkstat(fibos, "datamall", "RSI", "datamall", {
            "supply": "448498.64111085 RSI",
            "max_supply": "10000000000.00000000 RSI",
            "issuer": "datamall",
            "reserve_supply": "0.00000000 RSI"
        });
        checkstat(fibos, "datamall", "DMC", "datamall", {
            "supply": "3114573.8966 DMC",
            "max_supply": "10000000000.0000 DMC",
            "issuer": "datamall",
            "reserve_supply": "0.0000 DMC"
        });
    })

});

require.main === module && test.run(console.DEBUG);