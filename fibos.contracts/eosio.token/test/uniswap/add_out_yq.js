let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let checkaccount = test_util.checkaccount;
let fmtDate = test_util.fmtDate;
let checkunswapmarket = test_util.checkunswapmarket;
let checkmarketpool = test_util.checkmarketpool;
let checkmarketorder = test_util.checkmarketorder;
let now;
var users = {};

describe(`add and out`, () => {
    let symbol = "AAA";
    let contract = "user1"
    let contract2 = "user2"
    let fibos, ctx, name, name1, name2;
    let precision = 4;

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        name2 = contract2;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
            test_util.user(fibos, name);
        }
        if (name2 !== 'eosio' && name2 !== 'fibos' && !users[name2]) {
            users[name2] = true;
            test_util.user(fibos, name2);
        }
        name1 = test_util.user(fibos);
        ctx = fibos.contractSync("eosio.token");

        ctx.createSync("eosio", "50000000.0000 EOS", {
            authorization: "eosio"
        });
        ctx.excreateSync("eosio", `10000000.0000 FO`, `100.0000 FO`, 0, {
            authorization: "eosio"
        });
        ctx.issueSync("fibos", `10000100.0000 EOS`, `issue 100.0000 EOS`, {
            authorization: "eosio"
        });
        ctx.issueSync("fibos", `1000100.0000 FO`, `issue 100.0000 FO`, {
            authorization: "eosio"
        });
        let transfer_amount = "100.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        ctx.extransferSync("fibos", name, `${transfer_amount} EOS@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        ctx.extransferSync("fibos", name2, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name2}`, {
            authorization: "fibos"
        });
        ctx.extransferSync("fibos", name2, `${transfer_amount} EOS@eosio`, `exchange FO to ${symbol}@${name2}`, {
            authorization: "fibos"
        });
        now = fmtDate();
        ctx.excreateSync(name, fmt(100000000000, precision, symbol), fmt(300000000, precision, symbol), now, {
            authorization: name
        });
        ctx.exissueSync(name, `1000000.0000 AAA@${name}`, `issue 1000000.0000 AAA`, {
            authorization: name
        });
    });

    it(`create market`, () => {
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9999900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "999900.0000 FO",
            "contract": "eosio"
        });
        ctx.addreservesSync("fibos", "10000.0000 EOS@eosio", "1000.0000 FO@eosio", {
            authorization: "fibos"
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10000.0000 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1000.0000 FO",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        })
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "10000.00000000000000000"
        });
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9989900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "998900.0000 FO",
            "contract": "eosio"
        });
    });

    it(`使用user1来进行加仓，EOS，FO各加10  `, () => {
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "100.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "100.0000 FO",
            "contract": "eosio"
        });
        ctx.addreservesSync(name, "10.0000 EOS@eosio", "10.0000 FO@eosio", {
            authorization: name
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10010.0000 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1010.0000 FO",
                "contract": "eosio"
            },
            "total_weights": "10054.89930332472431473"
        })
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "10000.00000000000000000"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "54.89930332472479790"
        });
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "90.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "90.0000 FO",
            "contract": "eosio"
        });
    });

    it(`使用fibos来进行减仓，减0.01  `, () => {
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9989900.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "998900.0000 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "10000.00000000000000000"
        });
        ctx.outreservesSync("fibos", "0.0000 EOS@eosio", "0.0000 FO@eosio", 0.01, {
            authorization: "fibos"
        });

        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "9910.5461 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "999.9652 FO",
                "contract": "eosio"
            },
            "total_weights": "9954.89930332472431473"
        })
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "9900.00000000000000000"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "54.89930332472479790"
        });
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9989999.4539 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "998910.0348 FO",
            "contract": "eosio"
        });
    });

    it(`使用user1来进行减仓，减0.1  `, () => {
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "90.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "90.0000 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "54.89930332472479790"
        });
        ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", 0.1, {
            authorization: name
        });

        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "9905.0861 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "999.4143 FO",
                "contract": "eosio"
            },
            "total_weights": "9949.40937299225151946"
        })
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "9900.00000000000000000"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "49.40937299225231527"
        });
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "95.4600 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "90.5509 FO",
            "contract": "eosio"
        });
    });

    it(`使用user1来进行减仓，EOS和FO的顺序颠倒，减0.2，应该和不颠倒顺序没有区别，还是同一个仓  `, () => {
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "95.4600 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "90.5509 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "49.40937299225231527"
        });
        ctx.outreservesSync(name, "0.0000 FO@eosio", "0.0000 EOS@eosio", 0.2, {
            authorization: name
        });

        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "9895.2581 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "998.4227 FO",
                "contract": "eosio"
            },
            "total_weights": "9939.52749839380157937"
        });

        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "9900.00000000000000000"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "39.52749839380184937"
        });
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "105.2880 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "91.5425 FO",
            "contract": "eosio"
        });

    });

    it(`使用user1来进行减仓，减eosio有的AAA通证，会抛出异常  `, () => {

        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 AAA@eosio", 1, {
                authorization: name
            });
        });

    });

    it(`使用user1来进行减仓，减name有的AAA通证，会抛出异常  `, () => {

        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 EOS@eosio", `0.0000 AAA@${name}`, 1, {
                authorization: name
            });
        });

    });

    it(`使用user1来进行减仓，减-0.1，会抛出异常  `, () => {
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "105.2880 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "91.5425 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "39.52749839380184937"
        });
        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", -0.1, {
                authorization: name
            });
        });

    });

    it(`使用user1来进行减仓，减-1，会抛出异常  `, () => {
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "105.2880 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "91.5425 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "39.52749839380184937"
        });
        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", -1, {
                authorization: name
            });
        });

    });

    it(`使用user1来进行减仓，减2，会抛出异常  `, () => {
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "105.2880 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "91.5425 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "39.52749839380184937"
        });
        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", 2, {
                authorization: name
            });
        });

    });

    it(`使用user1来进行减仓，减0.00001，精度错误（超过小数点后4位），会抛出异常  `, () => {

        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", 0.00001, {
                authorization: name
            });
        });

    });

    it(`使用user1来进行减仓，减1，但是EOS和FO填写不为0，结果应该和填写为0一样  `, () => {
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "105.2880 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "91.5425 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "39.52749839380184937"
        });
        ctx.outreservesSync(name, "100.0000 EOS@eosio", "100.0000 FO@eosio", 1, {
            authorization: name
        });

        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "9855.9461 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "994.4562 FO",
                "contract": "eosio"
            },
            "total_weights": "9900.00000000000000000"
        });

        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "9900.00000000000000000"
        });

        checkmarketpool(fibos, name, 0, null);

        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "144.6000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "95.5090 FO",
            "contract": "eosio"
        });

    });

    it(`使用user1来进行减仓，但是使用fibos的权限，会抛出异常  `, () => {
        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", 0.1, {
                authorization: "fibos"
            });
        });

    });

    it(`使用user1来进行减仓，但是EOS填写为负数，会抛出异常  `, () => {
        assert.throws(() => {
            ctx.outreservesSync(name, "-2.0000 EOS@eosio", "2.0000 FO@eosio", 0.1, {
                authorization: "fibos"
            });
        });

    });

    it(`使用user1来进行减仓，但是FO填写为负数，会抛出异常  `, () => {
        assert.throws(() => {
            ctx.outreservesSync(name, "2.0000 EOS@eosio", "-2.0000 FO@eosio", 0.1, {
                authorization: "fibos"
            });
        });

    });

    it(`使用user1来进行减仓，但是EOS，FO填写为负数，会抛出异常  `, () => {
        assert.throws(() => {
            ctx.outreservesSync(name, "-2.0000 EOS@eosio", "-2.0000 FO@eosio", 0.1, {
                authorization: "fibos"
            });
        });

    });

    it(`使用fibos来进行加仓，EOS加 1110,FO 加100,会导致p变化大于0.01,会抛异常 `, () => {
        assert.throws(() => {
            ctx.addreservesSync("fibos", "1110.0000 EOS@eosio", "100.0000 FO@eosio", {
                authorization: "fibos"
            });
        });
    });

    it(`使用fibos来进行加仓，EOS加 900,FO 加100,会导致p变化小于0.99,会抛异常 `, () => {
        assert.throws(() => {
            ctx.addreservesSync("fibos", "800.0000 EOS@eosio", "100.0000 FO@eosio", {
                authorization: "fibos"
            });
        });
    });

    it(`使用user1来进行加仓，EOS加10.1，精度错误，会抛异常`, () => {
        assert.throws(() => {
            ctx.addreservesSync(name, "10.1 EOS@eosio", "10.0000 FO@eosio", {
                authorization: name
            });
        });
    })

    it(`使用user1来进行加仓，FO加10.000，精度错误，会抛异常`, () => {
        assert.throws(() => {
            ctx.addreservesSync(name, "10.1000 EOS@eosio", "10.000 FO@eosio", {
                authorization: name
            });
        });
    })

    it(`使用user1来进行加仓，EOS，FO加0.0001，权重改变<0.01%，会抛异常.`, () => {
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "144.6000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "95.5090 FO",
            "contract": "eosio"
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "9855.9461 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "994.4562 FO",
                "contract": "eosio"
            },
            "total_weights": "9900.00000000000000000"
        });
        assert.throws(() => {
            ctx.addreservesSync(name, "0.1111 EOS@eosio", "0.1111 FO@eosio", {
                authorization: name
            });
        });
    })

    it(`使用user1来进行加仓，使用eosio未有的AAA通证，会抛异常`, () => {
        assert.throws(() => {
            ctx.addreservesSync(name, "10.1000 AAA@eosio", "10.0000 FO@eosio", {
                authorization: name
            });
        });
    })

    it(`使用user1来进行加仓，FO加10，精度错误，会抛异常`, () => {
        assert.throws(() => {
            ctx.addreservesSync(name, "10.1000 EOS@eosio", "10 FO@eosio", {
                authorization: name
            });
        });
    })

    it(`使用user1来进行加仓，权限使用fibos，会抛异常`, () => {
        assert.throws(() => {
            ctx.addreservesSync(name, "10.0000 EOS@eosio", "10.0000 FO@eosio", {
                authorization: "fibo"
            });
        });
    })

    it(`使用user1来进行加仓，EOS为负数，会抛异常`, () => {
        assert.throws(() => {
            ctx.addreservesSync(name, "-10.0000 EOS@eosio", "10.0000 FO@eosio", {
                authorization: name
            });
        });
    })

    it(`使用user1来进行加仓，FO为负数，会抛异常`, () => {
        assert.throws(() => {
            ctx.addreservesSync(name, "10.0000 EOS@eosio", "-10.0000 FO@eosio", {
                authorization: name
            });
        });
    })

    it(`使用user1来进行加仓，EOS和FO都为负数，会抛异常`, () => {
        assert.throws(() => {
            ctx.addreservesSync(name, "-10.0000 EOS@eosio", "-10.0000 FO@eosio", {
                authorization: name
            });
        });
    })

    it(`使用user1来进行加仓，EOS超过拥有的EOS，会抛异常`, () => {
        assert.throws(() => {
            ctx.addreservesSync(name, "144.6997 EOS@eosio", "10.0000 FO@eosio", {
                authorization: name
            });
        });
    })

    it(`使用user1来进行加仓，FO超过拥有的FO，会抛异常`, () => {
        assert.throws(() => {
            ctx.addreservesSync(name, "10.0000 EOS@eosio", "95.5191 FO@eosio", {
                authorization: name
            });
        });
    })

    it(`使用user1来进行加仓，EOS，FO各加10，顺序颠倒，结果与不颠倒没有影响  `, () => {
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "144.6000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "95.5090 FO",
            "contract": "eosio"
        });
        ctx.addreservesSync(name, "10.0000 FO@eosio", "10.0000 EOS@eosio", {
            authorization: name
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "9865.9461 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1004.4562 FO",
                "contract": "eosio"
            },
            "total_weights": "9954.69769733059001737"
        });
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "9900.00000000000000000"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "54.69769733058965500"
        });
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "134.6000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "85.5090 FO",
            "contract": "eosio"
        });
    });

    it(`使用user1来进行减仓，减0.0001， `, () => {

        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "134.6000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "85.5090 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "9900.00000000000000000"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "54.69769733058965500"
        });
        ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", 0.0001, {
            authorization: name
        });

        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "9865.9407 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1004.4557 FO",
                "contract": "eosio"
            },
            "total_weights": "9954.69222756085764559"
        });

        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "54.69222756085659398"
        });
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "134.6054 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "85.5095 FO",
            "contract": "eosio"
        });
    });

    it(`使用user1来进行减仓，减0.9999， 会抛异常`, () => {

        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "134.6054 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "85.5095 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "9900.00000000000000000"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "54.69222756085659398"
        });
        assert.throws(() => {
            ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", 0.9999, {
                authorization: name
            });
        });

    });

    it(`使用user2来进行加仓，EOS，FO各加10  `, () => {
        checkaccount(fibos, name2, "EOS", "eosio", {
            "quantity": "100.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name2, "FO", "eosio", {
            "quantity": "100.0000 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "9900.00000000000000000"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "54.69222756085659398"
        });
        ctx.addreservesSync(name2, "10.0000 EOS@eosio", "10.0000 FO@eosio", {
            authorization: name2
        });
        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "9875.9407 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "1014.4557 FO",
                "contract": "eosio"
            },
            "total_weights": "10009.19092032837761508"
        });
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "9900.00000000000000000"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "54.69222756085659398"
        });
        checkmarketpool(fibos, name2, 0, {
            "owner": name2,
            "weights": "54.49869276751937264"
        });
        checkaccount(fibos, name2, "EOS", "eosio", {
            "quantity": "90.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name2, "FO", "eosio", {
            "quantity": "90.0000 FO",
            "contract": "eosio"
        });
    });

    it(`使用user1来进行减仓，减1, 使用fibos来进行减仓，减1，查看市场的权重肯定等于剩下的user2的权重 `, () => {
        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "134.6054 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "85.5095 FO",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9989999.4539 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "998910.0348 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "9900.00000000000000000"
        });
        checkaccount(fibos, name2, "EOS", "eosio", {
            "quantity": "90.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name2, "FO", "eosio", {
            "quantity": "90.0000 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, "fibos", 0, {
            "owner": "fibos",
            "weights": "9900.00000000000000000"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "54.69222756085659398"
        });
        checkmarketpool(fibos, name2, 0, {
            "owner": name2,
            "weights": "54.49869276751937264"
        });
        ctx.outreservesSync(name, "0.0000 EOS@eosio", "0.0000 FO@eosio", 1, {
            authorization: name
        });
        ctx.outreservesSync("fibos", "0.0000 EOS@eosio", "0.0000 FO@eosio", 1, {
            authorization: "fibos"
        });

        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "63.5418 EOS",
                "contract": "eosio"
            },
            "tokeny": {
                "quantity": "6.5270 FO",
                "contract": "eosio"
            },
            "total_weights": "54.49869276751937264"
        });

        checkaccount(fibos, name, "EOS", "eosio", {
            "quantity": "188.5155 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "91.0471 FO",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "9999757.9427 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "999912.4259 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, "fibos", 0, null);
        checkmarketpool(fibos, name, 0, null);
        checkmarketpool(fibos, name2, 0, {
            "owner": name2,
            "weights": "54.49869276751937264"
        });

    });

    it(`使用user2来进行减仓，减1, 查看市场是空仓`, () => {

        checkaccount(fibos, name2, "EOS", "eosio", {
            "quantity": "90.0000 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name2, "FO", "eosio", {
            "quantity": "90.0000 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, name2, 0, {
            "owner": name2,
            "weights": "54.49869276751937264"
        });
        ctx.outreservesSync(name2, "0.0000 EOS@eosio", "0.0000 FO@eosio", 1, {
            authorization: name2
        });

        checkunswapmarket(fibos, "FO@eosio", "EOS@eosio", null);

        checkaccount(fibos, name2, "EOS", "eosio", {
            "quantity": "153.5418 EOS",
            "contract": "eosio"
        });
        checkaccount(fibos, name2, "FO", "eosio", {
            "quantity": "96.5270 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, "fibos", 0, null);
        checkmarketpool(fibos, name, 0, null);
        checkmarketpool(fibos, name2, 0, null);

    });

    it(`使用user1来进行加仓，使用name的AAA通证`, () => {

        checkaccount(fibos, name, "AAA", name, {
            "quantity": "1000000.0000 AAA",
            "contract": name
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "91.0471 FO",
            "contract": "eosio"
        });
        ctx.addreservesSync(name, `10.0000 AAA@${name}`, "10.0000 FO@eosio", {
            authorization: name
        });

        checkunswapmarket(fibos, `AAA@${name}`, "FO@eosio", {
            "primary": 0,
            "tokenx": {
                "quantity": "10.0000 AAA",
                "contract": name
            },
            "tokeny": {
                "quantity": "10.0000 FO",
                "contract": "eosio"
            },
            "total_weights": "10000.00000000000000000"
        });

        checkaccount(fibos, name, "AAA", name, {
            "quantity": "999990.0000 AAA",
            "contract": name
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "81.0471 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, name, 0, {
            "owner": name,
            "weights": "10000.00000000000000000"
        });
    })

    let bid_id;
    it(`挂单`, () => {
        ctx.exchangeSync(name, `10.0000 AAA@${name}`, "0.0000 FO@eosio", 1, "test", "memo", {
            authorization: name
        });
        bid_id = fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder").rows[0].bid_id
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder"), {
            "rows": [],
            "more": false
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder"), {
            "rows": [
                {
                    "bid_id": bid_id,
                    "owner": "user1",
                    "price": "4294967296",
                    "quantity": {
                        "quantity": "10.0000 FO",
                        "contract": "eosio"
                    },
                    "filled": {
                        "quantity": "10.0000 AAA",
                        "contract": "user1"
                    }
                }
            ],
            "more": false
        });
        checkaccount(fibos, name, "AAA", name, {
            "quantity": "999980.0000 AAA",
            "contract": "user1"
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "81.0471 FO",
            "contract": "eosio"
        });
    })

    it(`市场消失，挂单被撤回`, () => {
        let r = ctx.outreservesSync(name, `0.0000 AAA@${name}`, "0.0000 FO@eosio", 1, {
            authorization: name
        });
        assert.deepEqual(r.processed.action_traces[0].inline_traces[0].act.data, {
            "bid_id": bid_id,
            "state": 1
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", 0, "swaporder"), {
            "rows": [],
            "more": false
        });
        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", "18374686479671623680", "swaporder"), {
            "rows": [],
            "more": false
        });
        checkaccount(fibos, name, "AAA", name, {
            "quantity": "1000000.0000 AAA",
            "contract": name
        });
        checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "91.0471 FO",
            "contract": "eosio"
        });
        checkmarketpool(fibos, name, 0, null);
    })
});

require.main === module && test.run(console.DEBUG);