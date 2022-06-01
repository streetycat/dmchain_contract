const test = require('test');

test.setup();

let test_util = require('../../test_util');
let fmtDate = test_util.fmtDate;

test_util.runBIOS();
let checkstat = test_util.checkstat;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let now;
let symbol1 = "BBB";
let firstloaded = true;

SmartToken('AAA', 'user1', 'FO', 4, 10000000000, 10000000000, 10000000, 10000000);
SmartToken2('BBB', 'user1', 'FO', 4, 10000000000, 10000000000, 100, 50);

function SmartToken(symbol, contract, connector_symbol, precision, ms_amount, me_amount, rs_amount, rc_amount) {
    describe(`stable coin exchange`, () => {
        let ctx, name, fund;
        let max_supply = fmt(ms_amount, precision, symbol);
        let max_exchange = fmt(me_amount, precision, symbol);
        let reserve_supply = fmt(rs_amount, precision, symbol);
        let reserve_connector_balance = fmt(rc_amount, precision, connector_symbol);

        before(() => {
            name = contract;
            now = fmtDate(5);
            ctx = fibos.contractSync("eosio.token");
            if (firstloaded) {
                fund = 'fibos';
                if (name !== 'eosio' && name !== 'fibos') {
                    test_util.user(fibos, name);
                    fund = contract;
                }
                ctx.createSync("eosio", "50000000.0000 EOS", {
                    authorization: "eosio"
                });
                ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                    authorization: "fibos"
                });

                ctx.excreateSync("eosio", `100000000000.0000 FO`, 0, `10000000000.0000 FO`, `5000000000.0000 FO`, `550000.0000 EOS`, 0, 0, 0, 'eosio', {
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
            ctx.issueSync('fibos', `1408102.0000 FO@eosio`, '0.0000 EOS@eosio', {
                authorization: 'eosio'
            });

            ctx.extransferSync("fibos", name, `10000.0000 FO@eosio`, `extransfer FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });

        });

        it('excreate token', () => {
            ctx.excreateSync(name, max_supply, 1, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(0, precision, symbol, name), 1, "setposition", {
                authorization: name
            })
            checkstat(fibos, name, symbol, name, {
                "supply": "0.0000 AAA",
                "max_supply": "10000000000.0000 AAA",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 AAA",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "0.0000 FO",
                "reserve_supply": "10000000.0000 AAA",
                "reserve_connector_balance": "10000000.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 1 FO `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(1, precision, "FO", "eosio"), fmt(0, precision, symbol, name), `exchange FO to ${symbol}@${name} ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "5.0000 AAA",
                "max_supply": "10000000000.0000 AAA",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 AAA",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "5.0000 FO",
                "reserve_supply": "10000000.0000 AAA",
                "reserve_connector_balance": "10000000.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 10 FO `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(10, precision, "FO", "eosio"), fmt(0, precision, symbol, name), `exchange FO to ${symbol}@${name} ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "55.0000 AAA",
                "max_supply": "10000000000.0000 AAA",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 AAA",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "55.0000 FO",
                "reserve_supply": "10000000.0000 AAA",
                "reserve_connector_balance": "10000000.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 100 FO `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(100, precision, "FO", "eosio"), fmt(0, precision, symbol, name), `exchange FO to ${symbol}@${name} ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "555.0000 AAA",
                "max_supply": "10000000000.0000 AAA",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 AAA",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "555.0000 FO",
                "reserve_supply": "10000000.0000 AAA",
                "reserve_connector_balance": "10000000.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 10 AAA `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(10, precision, symbol, name), fmt(0, precision, "FO", "eosio"), `exchange ${symbol}@${name} to FO ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "505.0000 AAA",
                "max_supply": "10000000000.0000 AAA",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 AAA",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "505.0000 FO",
                "reserve_supply": "10000000.0000 AAA",
                "reserve_connector_balance": "10000000.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`unlock 10 AAA`, () => {
            for (let i = 0; i < 5; i++) {
                ctx.exunlockSync(name, fmt(10, precision, symbol, name), now, `exlock ${i}`, {
                    authorization: name
                })
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "555.0000 AAA",
                "max_supply": "10000000000.0000 AAA",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 AAA",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "555.0000 FO",
                "reserve_supply": "9999950.0000 AAA",
                "reserve_connector_balance": "9999950.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 100.2167 FO `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(100.2167, precision, "FO", "eosio"), fmt(0, precision, symbol, name), `exchange FO to ${symbol}@${name} ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "1056.0835 AAA",
                "max_supply": "10000000000.0000 AAA",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 AAA",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "1056.0835 FO",
                "reserve_supply": "9999950.0000 AAA",
                "reserve_connector_balance": "9999950.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 1.24 AAA `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(1.24, precision, symbol, name), fmt(0, precision, "FO", "eosio"), `exchange ${symbol}@${name} to FO ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "1049.8835 AAA",
                "max_supply": "10000000000.0000 AAA",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 AAA",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "1049.8835 FO",
                "reserve_supply": "9999950.0000 AAA",
                "reserve_connector_balance": "9999950.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 0.0001 AAA `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(0.0001, precision, symbol, name), fmt(0, precision, "FO", "eosio"), `exchange ${symbol}@${name} to FO ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "1049.8830 AAA",
                "max_supply": "10000000000.0000 AAA",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 AAA",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "1049.8830 FO",
                "reserve_supply": "9999950.0000 AAA",
                "reserve_connector_balance": "9999950.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 0.0001 FO `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(0.0001, precision, "FO", "eosio"), fmt(0, precision, symbol, name), `exchange FO to ${symbol}@${name} ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "1049.8835 AAA",
                "max_supply": "10000000000.0000 AAA",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 AAA",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "1049.8835 FO",
                "reserve_supply": "9999950.0000 AAA",
                "reserve_connector_balance": "9999950.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });
    });
}

function SmartToken2(symbol, contract, connector_symbol, precision, ms_amount, me_amount, rs_amount, rc_amount) {
    describe(`stable coin exchange`, () => {
        let ctx, name, fund;
        let max_supply = fmt(ms_amount, precision, symbol);
        let max_exchange = fmt(me_amount, precision, symbol);
        let reserve_supply = fmt(rs_amount, precision, symbol);
        let reserve_connector_balance = fmt(rc_amount, precision, connector_symbol);

        before(() => {
            name = contract;
            now = fmtDate(5);
            ctx = fibos.contractSync("eosio.token");
            if (firstloaded) {
                fund = 'fibos';
                if (name !== 'eosio' && name !== 'fibos') {
                    test_util.user(fibos, name);
                    fund = contract;
                }
                ctx.createSync("eosio", "50000000.0000 EOS", {
                    authorization: "eosio"
                });
                ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                    authorization: "fibos"
                });

                ctx.excreateSync("eosio", `100000000000.0000 FO`, 0, `10000000000.0000 FO`, `5000000000.0000 FO`, `550000.0000 EOS`, 0, 0, 0, 'eosio', {
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
            ctx.issueSync('fibos', `1408102.0000 FO@eosio`, '0.0000 EOS@eosio', {
                authorization: 'eosio'
            });

            ctx.extransferSync("fibos", name, `10000.0000 FO@eosio`, `extransfer FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });

        it('excreate token', () => {
            ctx.excreateSync(name, max_supply, 1, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(0, precision, symbol, name), 1, "setposition", {
                authorization: name
            })
            checkstat(fibos, name, symbol, name, {
                "supply": "0.0000 BBB",
                "max_supply": "10000000000.0000 BBB",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 BBB",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "0.0000 FO",
                "reserve_supply": "100.0000 BBB",
                "reserve_connector_balance": "50.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 10 FO `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(10, precision, "FO", "eosio"), fmt(0, precision, symbol, name), `exchange FO to ${symbol}@${name} ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "100.0000 BBB",
                "max_supply": "10000000000.0000 BBB",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 BBB",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "50.0000 FO",
                "reserve_supply": "100.0000 BBB",
                "reserve_connector_balance": "50.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 0.001 BBB `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(0.001, precision, symbol, name), fmt(0, precision, "FO", "eosio"), `exchange FO to ${symbol}@${name} ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "99.9950 BBB",
                "max_supply": "10000000000.0000 BBB",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 BBB",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "49.9975 FO",
                "reserve_supply": "100.0000 BBB",
                "reserve_connector_balance": "50.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 10 FO `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(10, precision, "FO", "eosio"), fmt(0, precision, symbol, name), `exchange FO to ${symbol}@${name} ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "199.9950 BBB",
                "max_supply": "10000000000.0000 BBB",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 BBB",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "99.9975 FO",
                "reserve_supply": "100.0000 BBB",
                "reserve_connector_balance": "50.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 100 FO `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(100, precision, "FO", "eosio"), fmt(0, precision, symbol, name), `exchange FO to ${symbol}@${name} ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "1199.9950 BBB",
                "max_supply": "10000000000.0000 BBB",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 BBB",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "599.9975 FO",
                "reserve_supply": "100.0000 BBB",
                "reserve_connector_balance": "50.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 1 BBB `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(1, precision, symbol, name), fmt(0, precision, "FO", "eosio"), `exchange ${symbol}@${name} to FO ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "1194.9950 BBB",
                "max_supply": "10000000000.0000 BBB",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 BBB",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "597.4975 FO",
                "reserve_supply": "100.0000 BBB",
                "reserve_connector_balance": "50.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`unlock 1 BBB `, () => {
            for (let i = 0; i < 5; i++) {
                ctx.exunlockSync(name, fmt(1, precision, symbol, name), now, `exlock ${i}`, {
                    authorization: name
                })
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "1199.9950 BBB",
                "max_supply": "10000000000.0000 BBB",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 BBB",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "599.9975 FO",
                "reserve_supply": "95.0000 BBB",
                "reserve_connector_balance": "47.5000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 100.2167 FO `, () => {
            test_util.exchange(fibos, name, fmt(100.2167, precision, "FO", "eosio"), fmt(0, precision, symbol, name), `exchange FO to ${symbol}@${name}`)
            checkstat(fibos, name, symbol, name, {
                "supply": "1400.4284 BBB",
                "max_supply": "10000000000.0000 BBB",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 BBB",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "700.2142 FO",
                "reserve_supply": "95.0000 BBB",
                "reserve_connector_balance": "47.5000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 1.24 BBB `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(1.24, precision, symbol, name), fmt(0, precision, "FO", "eosio"), `exchange ${symbol}@${name} to FO ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "1394.2284 BBB",
                "max_supply": "10000000000.0000 BBB",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 BBB",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "697.1142 FO",
                "reserve_supply": "95.0000 BBB",
                "reserve_connector_balance": "47.5000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });

        it(`exchange 0.0001 FO `, () => {
            for (let i = 0; i < 5; i++) {
                test_util.exchange(fibos, name, fmt(0.0001, precision, "FO", "eosio"), fmt(0, precision, symbol, name), `exchange FO to ${symbol}@${name} ${i}`)
            }
            checkstat(fibos, name, symbol, name, {
                "supply": "1394.2294 BBB",
                "max_supply": "10000000000.0000 BBB",
                "issuer": "user1",
                "max_exchange": "10000000000.0000 BBB",
                "connector_weight": "1.00000000000000000",
                "connector_balance": "697.1147 FO",
                "reserve_supply": "95.0000 BBB",
                "reserve_connector_balance": "47.5000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
        });
    });
}

require.main === module && test.run(console.DEBUG);