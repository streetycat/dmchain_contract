let test = require('test');
test.setup();

let test_util = require('../test_util');
test_util.runBIOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let parseDate = test_util.parseDate;
var users = {};
var nametest;

describe("parameter_create", () => {
    describe(`new create classic token with reserve_supply`, () => {
        let fibos, name, ctx, time;
        before(() => {
            fibos = test_util.getFIBOS();
            nametest = test_util.user(fibos);
            name = test_util.user(fibos, name);
            ctx = fibos.contractSync("eosio.token");
        })


        it(`reserve_supply > max_supply`, () => {
            time = fmtDate();
            assert.throws(() => {
                ctx.excreateSync(name, `100000000000.0000 AAA`, 0, `0.0000 AAA`, `1000000000000.0000 AAA`, '0.0000 FO', time, 0, 0, 'eosio', {
                    authorization: name
                });
            });
        });

        it(`reserve_supply and max_supply symbol dismatch`, () => {
            time = fmtDate();
            assert.throws(() => {
                ctx.excreateSync(name, `100000000000.0000 AAA`, 0, `0.0000 AAA`, `10000000000.0000 BBB`, '0.0000 FO', time, 0, 0, 'eosio', {
                    authorization: name
                });
            });
        })

        it(`reserve_supply is negative`, () => {
            time = fmtDate();
            assert.throws(() => {
                ctx.excreateSync(name, `100000000000.0000 AAA`, 0, `0.0000 AAA`, `-1.0000 AAA`, '0.0000 FO', time, 0, 0, 'eosio', {
                    authorization: name
                });
            });
        })

        it(`check stats`, () => {
            time = fmtDate();
            ctx.excreateSync(name, `100000000000.0000 AAA`, 0, `0.0000 AAA`, `100.0000 AAA`, '0.0000 FO', time, 0, 0, 'eosio', {
                authorization: name
            });
            test_util.checkstat(fibos, name, "AAA", name, {
                "supply": "0.0000 AAA",
                "max_supply": "100000000000.0000 AAA",
                "issuer": name,
                "max_exchange": "0.0000 FO",
                "connector_weight": "0.00000000000000000",
                "connector_balance": "0.0000 FO",
                "reserve_supply": "100.0000 AAA",
                "reserve_connector_balance": "0.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 0
            });
            test_util.checklockaccount(fibos, name, "AAA", name, parseDate(time), {
                "balance": {
                    "quantity": "100.0000 AAA",
                    "contract": name
                },
                "lock_timestamp": parseDate(time)
            });
        })


    })
    ClassicToken('EOS', 'user1');
    ClassicToken('FO', 'user1');
    ClassicToken('EOS', 'eosio');
    ClassicToken('FO', 'eosio');
    ClassicToken('FO', 'fibos');
    ClassicToken('EOS', 'fibos');
})

function ClassicToken(symbol, contract) {
    let sell_fee = "0.00000000000000000";
    describe(`Pass ${symbol}@${contract}`, () => {
        let fibos, ctx, name;

        before(() => {
            fibos = test_util.getFIBOS();
            name = contract;
            if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
                users[name] = true;
                test_util.user(fibos, name);
            }
            ctx = fibos.contractSync("eosio.token");
        });

        it('create parameter issuer', () => {
            assert.throws(() => {
                ctx.excreateSync("name111", `100000000000.0000 ${symbol}`, 0, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                    authorization: name
                });
            });
            test_util.checkstat(fibos, name, symbol, contract, null)
        })

        it('create permision issuer', () => {
            assert.throws(() => {
                ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 0, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                    authorization: nametest
                });
            });
            test_util.checkstat(fibos, name, symbol, contract, null)
        })

        it('create parameter maximum_supply', () => {
            assert.throws(() => {
                let r = ctx.excreateSync(name, `-100000000000.0000 A`, 0, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");
            });

            test_util.checkstat(fibos, name, symbol, contract, null)
        })

        it('create parameter connector_weight', () => {
            assert.throws(() => {
                ctx.excreateSync(name, `100000000000.0000 ${symbol}`, `0.0000 ${symbol}`, 0.000000000000000000000000000000000000000000000000000001, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                    authorization: name
                });
            });
            test_util.checkstat(fibos, name, symbol, contract, null)
        })

        it('create repeat', () => {
            let r = ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 0, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                authorization: name
            });
            let auth = name === "eosio" ? "fibos" : name;
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: auth
            });

            assert.equal(r.processed.action_traces[0].console, "");

            test_util.checkstat(fibos, name, symbol, contract, {
                "supply": `0.0000 ${symbol}`,
                "max_supply": `100000000000.0000 ${symbol}`,
                "issuer": name,
                "max_exchange": `0.0000 FO`,
                "connector_weight": "0.00000000000000000",
                "connector_balance": "0.0000 FO",
                "reserve_supply": `0.0000 ${symbol}`,
                "reserve_connector_balance": "0.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": sell_fee,
                "position": 1
            });

            assert.throws(() => {
                ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 0, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                    authorization: name
                });
            })

            test_util.checkstat(fibos, name, symbol, contract, {
                "supply": `0.0000 ${symbol}`,
                "max_supply": `100000000000.0000 ${symbol}`,
                "issuer": name,
                "max_exchange": `0.0000 FO`,
                "connector_weight": "0.00000000000000000",
                "connector_balance": "0.0000 FO",
                "reserve_supply": `0.0000 ${symbol}`,
                "reserve_connector_balance": "0.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": sell_fee,
                "position": 1
            });
        });
    });
}

require.main === module && test.run(console.DEBUG);
