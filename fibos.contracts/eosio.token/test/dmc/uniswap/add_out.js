let test = require('test');
test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let checkaccount = test_util.checkaccount;
let checkunswapmarket = test_util.checkunswapmarket;
let checkmarketpool = test_util.checkmarketpool;
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
        ctx.createSync("datamall", "50000000.0000 EOS", {
            authorization: "datamall"
        });
        ctx.excreateSync("datamall", `10000000.0000 FO`, `100.0000 FO`, 0, {
            authorization: "datamall"
        });
        ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
            authorization: "datamall"
        });
        ctx.issueSync("fibos", `1000000.0000 FO`, `issue 100.0000 FO`, {
            authorization: "datamall"
        });
        let transfer_amount = "10000.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@datamall`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        ctx.extransferSync("fibos", name1, `${transfer_amount} FO@datamall`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        ctx.extransferSync("fibos", name, `${transfer_amount} EOS@datamall`, `exchange EOS to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        ctx.extransferSync("fibos", name1, `${transfer_amount} EOS@datamall`, `exchange EOS to ${symbol}@${name}`, {
            authorization: "fibos"
        });

    });

    it(`(error, add): overdrawn balance`, () => {
        assert.throws(() => {
            ctx.addreservesSync("fibos", "10000000.0000 EOS@datamall", "1000000.0000 FO@datamall", {
                authorization: "fibos"
            });
        });
    })

    it(`(error, add): uniswap same token`, () => {
        assert.throws(() => {
            ctx.addreservesSync("fibos", "10.0000 FO@datamall", "10.0000 FO@datamall", {
                authorization: "fibos"
            });
        });
    })

    it(`(error, add): asset is not positive`, () => {
        assert.throws(() => {
            ctx.addreservesSync("fibos", "0.0000 FO@datamall", "0.0000 EOS@datamall", {
                authorization: "fibos"
            });
        });
    })

    it(`(pass, add): fist addreserves`, () => {
        ctx.addreservesSync("fibos", "10000.0000 EOS@datamall", "100.0000 FO@datamall", {
            authorization: "fibos"
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "10000.0000 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "100.0000 FO",
                "contract": "datamall"
            },
            "total_weights": "10000.00000000000000000"
        })
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "10000.00000000000000000"
        });
    });

    it(`(error, add): excessive price volatility`, () => {
        assert.throws(() => {
            ctx.addreservesSync("fibos", "1.0000 FO@datamall", "1000000.0000 EOS@datamall", {
                authorization: "fibos"
            });
        });
    })

    it(`(pass, add): other person addreserves`, () => {
        ctx.extransferSync("fibos", name, `10000.0000 EOS@datamall`, `exchange EOS `, {
            authorization: "fibos"
        });
        ctx.addreservesSync(name, "1100.0000 EOS@datamall", "10.0000 FO@datamall", {
            authorization: name
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "11100.0000 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "110.0000 FO",
                "contract": "datamall"
            },
            "total_weights": "11049.88687724901319598"
        })
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "10000.00000000000000000"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": "user1",
            "weights": "1049.88687724901410547"
        });
    });

    it(`(pass, add): self addreserves`, () => {
        ctx.addreservesSync("fibos", "1100.0000 EOS@datamall", "10.0000 FO@datamall", {
            authorization: "fibos"
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "12200.0000 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "120.0000 FO",
                "contract": "datamall"
            },
            "total_weights": "12099.58676980333802931"
        });
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "11049.69989255432483333"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": "user1",
            "weights": "1049.88687724901410547"
        });
    });

    it(`(pass, add): exchange args order is ok`, () => {
        ctx.addreservesSync("fibos", "10.0000 FO@datamall", "1100.0000 EOS@datamall", {
            authorization: "fibos"
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "13300.0000 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "130.0000 FO",
                "contract": "datamall"
            },
            "total_weights": "13149.14445886119210627"
        })
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "12099.25758161217891029"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": "user1",
            "weights": "1049.88687724901410547"
        });
    })

    it(`(error, out): invaild rate`, () => {
        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 FO@datamall", "0.0000 EOS@datamall", 0, {
                authorization: name
            });
        });
        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 FO@datamall", "0.0000 EOS@datamall", 1.1, {
                authorization: name
            });
        });
    })

    it(`(error, out): no such market`, () => {
        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 FO@datamall", "0.0000 FOD@datamall", 0.1, {
                authorization: name
            });
        });
    })

    it(`(error, out): no such user`, () => {
        assert.throws(() => {
            ctx.outreservesSync(name1, "0.0000 FO@datamall", "0.0000 EOS@datamall", 0.1, {
                authorization: name1
            });
        });
    })

    it(`(error, add): after add weights less than 0.01%`, () => {
        assert.throws(() => {
            ctx.addreservesSync("fibos", "0.0010 FO@datamall", "0.1000 EOS@datamall", {
                authorization: "fibos"
            });
        });
    })

    it(`(error, out): after out weights less than 0.01%`, () => {
        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 FO@datamall", "0.0000 EOS@datamall", 0.999, {
                authorization: name
            });
        });
    })

    it(`(pass, out): outreserves 100%`, () => {
        ctx.outreservesSync(name, "0.0000 FO@datamall", "0.0000 EOS@datamall", 1, {
            authorization: name
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "12238.0682 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "119.6203 FO",
                "contract": "datamall"
            },
            "total_weights": "12099.25758161217891029"
        })
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "12099.25758161217891029"
        });
        checkmarketpool(fibos, name, 0, null);
    })

    it(`(pass, out): outreserves 45%`, () => {
        ctx.outreservesSync("fibos", "0.0000 FO@datamall", "0.0000 EOS@datamall", 0.45, {
            authorization: "fibos"
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", {
            "primary": 0,
            "tokenx": {
                "quantity": "6730.9376 EOS",
                "contract": "datamall"
            },
            "tokeny": {
                "quantity": "65.7912 FO",
                "contract": "datamall"
            },
            "total_weights": "6654.59166988669858256"
        })
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "6654.59166988669858256"
        });
        checkaccount(fibos, "fibos", "EOS", "datamall", {
            "quantity": "9963307.1306 EOS",
            "contract": "datamall"
        });
        checkaccount(fibos, "fibos", "FO", "datamall", {
            "quantity": "979933.8291 FO",
            "contract": "datamall"
        });
    })

    it(`(pass, out): outreserves all`, () => {
        ctx.outreservesSync("fibos", "0.0000 FO@datamall", "0.0000 EOS@datamall", 1, {
            authorization: "fibos"
        });
        checkunswapmarket(fibos, "FO@datamall", "EOS@datamall", null)
        checkmarketpool(fibos, "fibos", 0, null);
    })

    it(`create 4,dmc and 8,rsi, addreservers`, () => {
        ctx.createSync("datamall", "10000000000.0000 DMC", {
            authorization: "datamall"
        });
        ctx.createSync("datamall", "10000000000.00000000 RSI", {
            authorization: "datamall"
        })
        ctx.issueSync("datamall", "3114573.8966 DMC", {
            authorization: "datamall"
        })
        ctx.issueSync("datamall", "448498.64111085 RSI", {
            authorization: "datamall"
        })
        checkaccount(fibos, "datamall", "RSI", "datamall", {
            "quantity": "448498.64111085 RSI",
            "contract": "datamall"
        });
        checkaccount(fibos, "datamall", "DMC", "datamall", {
            "quantity": "3114573.8966 DMC",
            "contract": "datamall"
        });
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
    })

    it(`user1 addreservers,by price`, () => {
        ctx.exissueSync(name1, "100000.0000 DMC@datamall", "issue to 1", {
            authorization: "datamall"
        })
        ctx.exissueSync(name1, "14400.00000000 RSI@datamall", "issue to 2", {
            authorization: "datamall"
        })
        checkaccount(fibos, name1, "DMC", "datamall", {
            "quantity": "100000.0000 DMC",
            "contract": "datamall"
        });
        checkaccount(fibos, name1, "RSI", "datamall", {
            "quantity": "14400.00000000 RSI",
            "contract": "datamall"
        });
        assert.throws(() => {
            ctx.addreservesSync(name1, "100000.0000 DMC@datamall", "14400.00000000 RSI@datamall", {
                authorization: name1
            });
        });
        checkaccount(fibos, name1, "DMC", "datamall", {
            "quantity": "100000.0000 DMC",
            "contract": "datamall"
        });
        checkaccount(fibos, name1, "RSI", "datamall", {
            "quantity": "14400.00000000 RSI",
            "contract": "datamall"
        });

    })

    it(`user1 outreserves`, () => {
        assert.throws(() => {
            ctx.outreservesSync(name1, "0.0000 DMC@datamall", "0.00000000 RSI@datamall", 1, {
                authorization: name1
            });
        });
    })
});

require.main === module && test.run(console.DEBUG);