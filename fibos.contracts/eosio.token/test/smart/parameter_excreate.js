let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;

var users = {};
var nametest;
var is_first = true;
describe("parameter_create", () => {
    before(() => {
        fibos = test_util.getFIBOS();
        nametest = test_util.user(fibos);
    })

    SmartToken('AAA', 'user1');
    SmartToken('BBB', 'eosio');
})

function SmartToken(symbol, contract) {
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
            if (is_first) {
                ctx.createSync("eosio", "50000000.0000 EOS", {
                    authorization: "eosio"
                });
                ctx.createSync("eosio", "10000000.000000 FOD", {
                    authorization: "eosio"
                });
                ctx.excreateSync("eosio", `10000000.0000 FO`, 0, `10000000.0000 FO`, `100.0000 FO`, `10000.0000 EOS`, fmtDate(), 0, 0, "eosio", {
                    authorization: "eosio"
                });
                is_first = false;
            }
        });

        it('create with insufficient connector balance', () => {
            assert.throws(() => {
                ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 0.5, `100000000000.0000 ${symbol}`, `10000000.0000 ${symbol}`, '0.9999 FO', fmtDate(), 0, 0, 'eosio', {
                    authorization: name
                });
            });
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
                ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 0.5, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                    authorization: nametest
                });
            });
            test_util.checkstat(fibos, name, symbol, contract, null)
        })

        it('create parameter maximum_supply', () => {
            assert.throws(() => {
                let r = ctx.excreateSync(name, `-100000000000.0000 A`, 0.5, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");
            });

            test_util.checkstat(fibos, name, symbol, contract, null)
        })

        it('create parameter connector_weight', () => {
            assert.throws(() => {
                ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 0.000000000000000000000000000000000000000000000000000001, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                    authorization: name
                });
            });
            test_util.checkstat(fibos, name, symbol, contract, null)
        })

        it('create repeat', () => {
            let r = ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 0.5, `100000000000.0000 ${symbol}`, `10000000.0000 ${symbol}`, '3000.0000 FO', fmtDate(), 0, 0, 'eosio', {
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
                "max_exchange": `100000000000.0000 ${symbol}`,
                "connector_weight": "0.50000000000000000",
                "connector_balance": "0.0000 FO",
                "reserve_supply": `10000000.0000 ${symbol}`,
                "reserve_connector_balance": "3000.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            assert.throws(() => {
                ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 0.5, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                    authorization: name
                });
            })

            test_util.checkstat(fibos, name, symbol, contract, {
                "supply": `0.0000 ${symbol}`,
                "max_supply": `100000000000.0000 ${symbol}`,
                "issuer": name,
                "max_exchange": `100000000000.0000 ${symbol}`,
                "connector_weight": "0.50000000000000000",
                "connector_balance": "0.0000 FO",
                "reserve_supply": `10000000.0000 ${symbol}`,
                "reserve_connector_balance": "3000.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`create dismatch precision`, () => {
            assert.throws(() => {
                ctx.excreateSync(name, `100000000000.0000 FFF`, 0.5, `100000000000.0000 FFF`, `10000000.0000 FFF`, '3000.00 FOD', fmtDate(), 0, 0, 'eosio', {
                    authorization: name
                });
            });
        });

        it('create with insufficient connector balance (FOD)', () => {
            assert.throws(() => {
                ctx.excreateSync(name, `100000000000.0000 FFF`, 0.5, `100000000000.0000 FFF`, `10000000.0000 FFF`, '0.9999999 FOD', fmtDate(), 0, 0, 'eosio', {
                    authorization: name
                });;
            });
        });

        it('create with symbol smaller than 4', () => {
            assert.throws(() => {
                ctx.excreateSync(name, `100000000000.000 FFF`, 0.5, `100000000000.000 FFF`, `10000000.000 FFF`, '0.9999999 FOD', fmtDate(), 0, 0, 'eosio', {
                    authorization: name
                });;
            });
        });
    });
}

require.main === module && test.run(console.DEBUG);
