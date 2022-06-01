const test = require('test');
const coroutine = require('coroutine');

test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let checkstat = test_util.checkstat;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;

SmartToken('AAA', 'user1', 'FO', 4);

let firstloaded = true;
function SmartToken(symbol, contract, connector_symbol, precision) {
    describe(`cut out number when exchange`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(30000000000, precision, symbol);
        let max_exchange = fmt(30000000000, precision, symbol);
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(3000000000, precision, symbol);
        let reserve_connector_balance = "90000.0000 FO";
        let tiny_amount = "0.0900";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            if (firstloaded) {
                ctx.createSync("eosio", "50000000.0000 EOS", {
                    authorization: "eosio"
                });
                ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                    authorization: "fibos"
                });
                ctx.excreateSync("eosio", `10000000.0000 FO`, 0, `10000000.0000 FO`, `100.0000 FO`, `10000.0000 EOS`, 0, 0, 0, 'eosio', {
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
            ctx.issueSync("fibos", `1000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "80000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
            ctx.excreateSync(name, max_supply, 0.15, max_exchange, reserve_supply, reserve_connector_balance, fmtDate(), 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
        });

        it(`exchange ${connector_symbol} to ${symbol}@${contract}`, () => {
            checkstat(fibos, name, symbol, contract, {
                "supply": "0.0000 AAA",
                "max_supply": "30000000000.0000 AAA",
                "issuer": "user1",
                "max_exchange": "30000000000.0000 AAA",
                "connector_weight": "0.14999999999999999",
                "connector_balance": "0.0000 FO",
                "reserve_supply": "3000000000.0000 AAA",
                "reserve_connector_balance": "90000.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            test_util.exchange(fibos, name, fmt(0.6001, 4, connector_symbol, "eosio"), fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)

            checkaccount(fibos, name, "FO", "eosio", {
                "quantity": "79999.3999 FO",
                "contract": "eosio"
            });

            checkaccount(fibos, name, symbol, contract, {
                "quantity": "3000.4914 AAA",
                "contract": "user1"
            });
        });

        it(`exchange ${symbol}@${contract} to ${connector_symbol}`, () => {
            coroutine.sleep(500);
            test_util.exchange(fibos, name, fmt(3000.4000, precision, symbol, name), fmt(0.0000, 4, connector_symbol, "eosio"), `exchange ${connector_symbol} to ${symbol}@${name}`)

            checkaccount(fibos, name, "FO", "eosio", {
                "quantity": "79999.9999 FO",
                "contract": "eosio"
            });

            checkaccount(fibos, name, symbol, contract, {
                "quantity": "0.0914 AAA",
                "contract": "user1"
            });
        });

        it(`exchange ${tiny_amount} ${symbol}@${contract} to ${connector_symbol} should throw`, () => {
            coroutine.sleep(500);
            ctx.extransferSync(name, name1, `0.0001 FO@eosio`, `tranfer ${symbol}@${name} to ${name1}`, {
                authorization: name
            });
            checkaccount(fibos, name1, "FO", "eosio", {
                "quantity": `0.0001 FO`,
                "contract": "eosio"
            });
            test_util.exchange(fibos, name1, fmt(0.0001, precision, "FO", "eosio"), fmt(0.0000, 4, symbol, name), `exchange ${symbol}@${name} to ${connector_symbol}`)
            checkaccount(fibos, name1, symbol, contract, {
                "quantity": "0.5000 AAA",
                "contract": "user1"
            });
            checkaccount(fibos, name1, "FO", "eosio", {
                "quantity": "0.0000 FO",
                "contract": "eosio"
            });

            assert.throws(() => {
                test_util.exchange(fibos, name1, fmt(0.4999, precision, symbol, name), fmt(0.0000, 4, "FO", "eosio"), `exchange ${symbol}@${name} to ${connector_symbol}`)
            })

            checkaccount(fibos, name1, symbol, contract, {
                "quantity": "0.5000 AAA",
                "contract": "user1"
            });
            checkaccount(fibos, name1, "FO", "eosio", {
                "quantity": "0.0000 FO",
                "contract": "eosio"
            });
        });
    });
}

require.main === module && test.run(console.DEBUG);