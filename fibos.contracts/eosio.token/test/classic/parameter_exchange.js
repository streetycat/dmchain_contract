let test = require('test');
test.setup();

let test_util = require('../test_util');
test_util.runBIOS();
let checkstat = test_util.checkstat;
let checkaccount = test_util.checkaccount;
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;

var nametest;
var users = {};

describe("parameter_destroy", () => {

    before(() => {
        fibos = test_util.getFIBOS();
        nametest = test_util.user(fibos);
    })

    ClassicToken('BBB', 'user1');
    ClassicToken('CCC', 'user2');
});

let firstloaded = true;
function ClassicToken(symbol, contract) {
    describe(`Parameter Check: exchange ${symbol}@${contract}`, () => {
        let fibos, ctx, name;

        before(() => {
            fibos = test_util.getFIBOS();
            name = contract;

            if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
                users[name] = true;
                test_util.user(fibos, name);
            }
            ctx = fibos.contractSync("eosio.token");

            if (firstloaded) {
                ctx.createSync("eosio", "50000000.0000 EOS", {
                    authorization: "eosio"
                });
                ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                    authorization: "fibos"
                });

                ctx.createSync("eosio", "1000000000.0000 FO", {
                    authorization: "eosio"
                });
                ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                    authorization: "fibos"
                });

                firstloaded = false;
            }

            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `100000.0000 FO`, `issue 10000000.0000 FO`, {
                authorization: "eosio"
            });

            let transfer_amount = "80000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });

            ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 0, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                authorization: name
            });
            let auth = name === "eosio" ? "fibos" : name;
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: auth
            });

        });

        it('classic token cannot exchange from FO', () => {
            checkaccount(fibos, name, "FO", "eosio", {
                "quantity": `80000.0000 FO`,
                "contract": "eosio"
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

            assert.throws(() => {
                ctx.exchangeSync(name, `1000.0000 FO@eosio`, `10000000.0000 ${symbol}@${contract}`, `exchange ${symbol}@${contract} to FO`, {
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
        });

        it('classic token cannot exchange to FO', () => {
            checkaccount(fibos, name, "FO", "eosio", {
                "quantity": `80000.0000 FO`,
                "contract": "eosio"
            });

            ctx.exissueSync(name, `100.0000 ${symbol}@${contract}`, `issue 100.0000 ${symbol}@${contract}`, {
                authorization: name
            });
            checkaccount(fibos, name, symbol, name, {
                "quantity": `100.0000 ${symbol}`,
                "contract": name
            });

            assert.throws(() => {
                ctx.exchangeSync(name, `10.0000 ${symbol}@${contract}`, `0.0000 FO@eosio`, `exchange ${symbol}@${contract} to FO`, {
                    authorization: name
                });
            });
        })
    });
}

require.main === module && test.run(console.DEBUG);