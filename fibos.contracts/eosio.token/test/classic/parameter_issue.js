let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
var nametest;
var users = {};

describe("parameter issue", () => {

    before(() => {
        fibos = test_util.getFIBOS();
        nametest = test_util.user(fibos);
    })

    ClassicToken('EOS', 'user1');
    // ClassicToken('FO', 'user1');
    // ClassicToken('EOS', 'eosio');
    // ClassicToken('FO', 'eosio');
    // ClassicToken('FO', 'fibos');
    // ClassicToken('EOS', 'fibos');
})


function ClassicToken(symbol, contract) {
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

        it('issue by not create', () => {
            assert.throws(() => {
                ctx.exissueSync(name, `50000.0000 ${symbol}@${name}`, `issue 50000.0000 ${symbol}@${name}`, {
                    authorization: name
                });
            });
            test_util.checkstat(fibos, name, symbol, name, null);
        });

        it('create token', () => {
            ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 0, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });

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
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            test_util.checkaccount(fibos, name, symbol, contract, null);
        })

        it('issue parameter to', () => {
            assert.throws(() => {
                ctx.exissueSync("name11", `50000.0000 ${symbol}@${name}`, `issue 50000.0000 ${symbol}@${name}`, {
                    authorization: name
                });
            });
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
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            test_util.checkaccount(fibos, "name11", symbol, contract, null);
        });


        it('issue permision issuer', () => {
            assert.throws(() => {
                ctx.exissueSync(name, `50000.0000 ${symbol}@${name}`, `issue 50000.0000 ${symbol}@${name}`, {
                    authorization: nametest
                });
            });
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
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            test_util.checkaccount(fibos, name, symbol, contract, null);
        });

        it('issue parameter quantity > max_supply', () => {
            assert.throws(() => {
                ctx.exissueSync(name, `100000000000.0001 ${symbol}@${name}`, `100000000000.0001 ${symbol}@${name}`, {
                    authorization: name
                });
            });
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
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            test_util.checkaccount(fibos, name, symbol, contract, null);
        });

        it('issue parameter quantity value', () => {
            assert.throws(() => {
                ctx.exissueSync(name, `-100.0000 ${symbol}@${name}`, `100.00001 ${symbol}@${name}`, {
                    authorization: name
                });
            });
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
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            test_util.checkaccount(fibos, name, symbol, contract, null);
        });


        it('issue parameter quantity precision', () => {
            assert.throws(() => {
                ctx.exissueSync(name, `100.00001 ${symbol}@${name}`, `100.00001 ${symbol}@${name}`, {
                    authorization: name
                });
            });
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
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            test_util.checkaccount(fibos, name, symbol, contract, null);
        });

        it('issue ok', () => {
            let r = ctx.exissueSync(name, `50000.0000 ${symbol}@${name}`, `issue 50000.0000 ${symbol}@${name}`, {
                authorization: name
            });
            assert.equal(r.processed.action_traces[0].console, "");

            test_util.checkstat(fibos, name, symbol, contract, {
                "supply": `50000.0000 ${symbol}`,
                "max_supply": `100000000000.0000 ${symbol}`,
                "issuer": name,
                "max_exchange": `0.0000 FO`,
                "connector_weight": "0.00000000000000000",
                "connector_balance": "0.0000 FO",
                "reserve_supply": `0.0000 ${symbol}`,
                "reserve_connector_balance": "0.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            test_util.checkaccount(fibos, name, symbol, contract, {
                "quantity": `50000.0000 ${symbol}`,
                "contract": name
            });
        });

        it('issue more than max_supply', () => {
            assert.throws(() => {
                let r = ctx.exissueSync(name, `100000000000.0000 ${symbol}@${name}`, `issue 50000.0000 ${symbol}@${name}`, {
                    authorization: name
                });
            })

            test_util.checkstat(fibos, name, symbol, contract, {
                "supply": `50000.0000 ${symbol}`,
                "max_supply": `100000000000.0000 ${symbol}`,
                "issuer": name,
                "max_exchange": `0.0000 FO`,
                "connector_weight": "0.00000000000000000",
                "connector_balance": "0.0000 FO",
                "reserve_supply": `0.0000 ${symbol}`,
                "reserve_connector_balance": "0.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            test_util.checkaccount(fibos, name, symbol, contract, {
                "quantity": `50000.0000 ${symbol}`,
                "contract": name
            });
        });
    });
}

require.main === module && test.run(console.DEBUG);