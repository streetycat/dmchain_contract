let test = require('test');
test.setup();

const coroutine = require('coroutine');
let test_util = require('../test_util');

let checkstat = test_util.checkstat;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let parseDate = test_util.parseDate;
let createTime;
let holderTime;

function SmartTokenForFourUnlockWithLockedTokensByHolders(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    let sell_fee = "0.00000000000000000"
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "1000000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `1000000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(90498.756211, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": `1000000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(90498.7562, precision, symbol),
                "contract": name
            });
        });

        describe('unlock without connector balance', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exlocktransSync(name, name1, fmt(1000, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                r = ctx.extransferSync(name, name1, fmt(90498.7562, precision, symbol, name), `transfer`, {
                    authorization: name
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                r = ctx.exunlockSync(name1, fmt(1000, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91498.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8896.1735, precision, symbol),
                    "reserve_connector_balance": "7914.1912 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(0.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91498.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8896.1735, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(name, name1, fmt(100, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(100, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                r = ctx.exunlockSync(name1, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91598.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8786.5160, precision, symbol),
                    "reserve_connector_balance": "7720.2858 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(0.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91598.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8786.5160, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(name, name1, fmt(10, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                r = ctx.exunlockSync(name1, fmt(10, precision, symbol, name), createTime, fmt(10, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91608.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8775.5575, precision, symbol),
                    "reserve_connector_balance": "7701.0401 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(0.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91608.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8775.5575, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });
        });
    });
};

function SmartTokenForSixUnlockWithLockedTokensByHolders(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";
        let sell_fee = "0.00000000000000000";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "1000000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `1000000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(90498.756211, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": `1000000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(90498.756211, precision, symbol),
                "contract": name
            });
        });

        describe('unlock without connector balance', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exlocktransSync(name, name1, fmt(1000, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                r = ctx.extransferSync(name, name1, fmt(90498.756211, precision, symbol, name), `transfer`, {
                    authorization: name
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                r = ctx.exunlockSync(name1, fmt(1000, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91498.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8896.173447, precision, symbol),
                    "reserve_connector_balance": "7914.1901 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(0.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91498.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8896.173447, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(name, name1, fmt(100, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(100, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                r = ctx.exunlockSync(name1, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91598.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8786.515922, precision, symbol),
                    "reserve_connector_balance": "7720.2861 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(0.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91598.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8786.515922, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(name, name1, fmt(10, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                r = ctx.exunlockSync(name1, fmt(10, precision, symbol, name), createTime, fmt(10, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91608.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8775.557331, precision, symbol),
                    "reserve_connector_balance": "7701.0405 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(0.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91608.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8775.557331, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });
        });
    });
};

function SmartTokenForFourUnlockWithTokensByHolders(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";
        let sell_fee = "0.00000000000000000";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "1000000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `1000000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(90498.756211, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": `1000000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(90498.7562, precision, symbol),
                "contract": name
            });
        });

        describe('unlock with tokens', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exlocktransSync(name, name1, fmt(1000, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                r = ctx.exunlockSync(name1, fmt(1000, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(90498.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": connector_weight,
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": reserve_supply,
                    "reserve_connector_balance": reserve_connector_balance,
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(89498.7562, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(1000.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(9000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(1000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(name, name1, fmt(100, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(100, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                r = ctx.exunlockSync(name1, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(90498.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": connector_weight,
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": reserve_supply,
                    "reserve_connector_balance": reserve_connector_balance,
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(89398.7562, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(1100.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8900.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(1100.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(name, name1, fmt(10, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                r = ctx.exunlockSync(name1, fmt(10, precision, symbol, name), createTime, fmt(10, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(90498.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": connector_weight,
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": reserve_supply,
                    "reserve_connector_balance": reserve_connector_balance,
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(89388.7562, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(1110.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8890.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(1110.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });
        });
    });
};

function SmartTokenForSixUnlockWithTokensByHolders(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "1000000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `1000000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(90498.756211, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": `1000000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(90498.756211, precision, symbol),
                "contract": name
            });
        });

        describe('unlock with tokens', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exlocktransSync(name, name1, fmt(1000, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");

                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                r = ctx.exunlockSync(name1, fmt(1000, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(90498.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": connector_weight,
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": reserve_supply,
                    "reserve_connector_balance": reserve_connector_balance,
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(89498.756211, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(1000.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(9000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(1000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(name, name1, fmt(100, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(100, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                r = ctx.exunlockSync(name1, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(90498.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": connector_weight,
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": reserve_supply,
                    "reserve_connector_balance": reserve_connector_balance,
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(89398.756211, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(1100.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8900.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(1100.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(name, name1, fmt(10, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                r = ctx.exunlockSync(name1, fmt(10, precision, symbol, name), createTime, fmt(10, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(90498.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": connector_weight,
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": reserve_supply,
                    "reserve_connector_balance": reserve_connector_balance,
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(89388.756211, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(1110.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8890.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(1110.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });
        });
    });
};

function SmartTokenForSixUnlockWithPartialTokensByHolders(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "1000000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `1000000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(90498.756211, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": `1000000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(90498.756211, precision, symbol),
                "contract": name
            });
        });

        describe('unlock with connector balance and locked tokens', () => {
            it('exunlock 1100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exlocktransSync(name, name1, fmt(1100, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                r = ctx.extransferSync(name, name1, fmt(90398.756211, precision, symbol, name), `transfer`, {
                    authorization: name
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1100, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8900, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(100.000000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(90398.756211, precision, symbol),
                    "contract": name
                });

                r = ctx.exunlockSync(name1, fmt(1100, precision, symbol, name), createTime, fmt(1100, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91498.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8896.173447, precision, symbol),
                    "reserve_connector_balance": "7914.1901 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": "0.000000 AAA",
                    "contract": "user1"
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91498.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8896.173447, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 110', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8896.173447, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exlocktransSync(name, name1, fmt(110, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                r = ctx.extransferSync(name1, name, fmt(10.0000, precision, symbol, name), `transfer`, {
                    authorization: name1
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(110, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(10.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91488.756211, precision, symbol),
                    "contract": name
                });

                r = ctx.exunlockSync(name1, fmt(110, precision, symbol, name), createTime, fmt(110, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91598.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8786.515922, precision, symbol),
                    "reserve_connector_balance": "7720.2861 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": "0.000000 AAA",
                    "contract": "user1"
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91598.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8786.173447, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(0.342475, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 11', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8786.173447, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exlocktransSync(name, name1, fmt(11, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                r = ctx.extransferSync(name1, name, fmt(1.0000, precision, symbol, name), `transfer`, {
                    authorization: name1
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(11, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(1.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91597.756211, precision, symbol),
                    "contract": name
                });

                r = ctx.exunlockSync(name1, fmt(11, precision, symbol, name), createTime, fmt(11, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91608.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8775.557331, precision, symbol),
                    "reserve_connector_balance": "7701.0405 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": "0.000000 AAA",
                    "contract": "user1"
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91608.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8775.173447, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(0.383884, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });
        });
    });
};

function SmartTokenForFourUnlockWithPartialTokensByHolders(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "1000000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `1000000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(90498.756211, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": `1000000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(90498.7562, precision, symbol),
                "contract": name
            });
        });

        describe('unlock with connector balance and locked tokens', () => {
            it('exunlock 1100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exlocktransSync(name, name1, fmt(1100, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                r = ctx.extransferSync(name, name1, fmt(90398.7562, precision, symbol, name), `transfer`, {
                    authorization: name
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1100, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8900, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(100.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(90398.7562, precision, symbol),
                    "contract": name
                });

                r = ctx.exunlockSync(name1, fmt(1100, precision, symbol, name), createTime, fmt(1100, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91498.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8896.1735, precision, symbol),
                    "reserve_connector_balance": "7914.1912 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": "0.0000 AAA",
                    "contract": "user1"
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91498.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8896.1735, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 110', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8896.1735, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exlocktransSync(name, name1, fmt(110, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                r = ctx.extransferSync(name1, name, fmt(10.0000, precision, symbol, name), `transfer`, {
                    authorization: name1
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(110, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(10.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91488.7562, precision, symbol),
                    "contract": name
                });

                r = ctx.exunlockSync(name1, fmt(110, precision, symbol, name), createTime, fmt(110, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91598.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8786.5160, precision, symbol),
                    "reserve_connector_balance": "7720.2858 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": "0.0000 AAA",
                    "contract": "user1"
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91598.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8786.1735, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(0.3425, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 11', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8786.1735, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exlocktransSync(name, name1, fmt(11, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                r = ctx.extransferSync(name1, name, fmt(1.0000, precision, symbol, name), `transfer`, {
                    authorization: name1
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(11, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(1.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91597.7562, precision, symbol),
                    "contract": name
                });

                r = ctx.exunlockSync(name1, fmt(11, precision, symbol, name), createTime, fmt(11, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91608.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8775.5575, precision, symbol),
                    "reserve_connector_balance": "7701.0401 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": "0.0000 AAA",
                    "contract": "user1"
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91608.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8775.1735, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(0.3840, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });
        });
    });
};

function SmartTokenForFourUnlockWithLockedTokensByFund(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "1000000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `1000000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(90498.756211, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": `1000000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(90498.7562, precision, symbol),
                "contract": name
            });
        });

        describe('unlock with locked tokens', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exunlockSync(name, fmt(1000, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91498.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8896.1735, precision, symbol),
                    "reserve_connector_balance": "7914.1912 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91498.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8896.1735, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exunlockSync(name, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91598.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8786.5160, precision, symbol),
                    "reserve_connector_balance": "7720.2858 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91598.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8786.5160, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exunlockSync(name, fmt(10, precision, symbol, name), createTime, fmt(10, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91608.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8775.5575, precision, symbol),
                    "reserve_connector_balance": "7701.0401 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91608.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8775.5575, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });
        });
    });
};

function SmartTokenForSixUnlockWithLockedTokensByFund(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "1000000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `1000000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(90498.756211, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": `1000000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(90498.756211, precision, symbol),
                "contract": name
            });
        });

        describe('unlock with locked tokens', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exunlockSync(name, fmt(1000, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91498.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8896.173447, precision, symbol),
                    "reserve_connector_balance": "7914.1901 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91498.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8896.173447, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exunlockSync(name, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91598.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8786.515922, precision, symbol),
                    "reserve_connector_balance": "7720.2861 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91598.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8786.515922, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exunlockSync(name, fmt(10, precision, symbol, name), createTime, fmt(10, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91608.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000000.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8775.557331, precision, symbol),
                    "reserve_connector_balance": "7701.0405 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91608.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8775.557331, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });
        });
    });
};

function SmartTokenForFourUnlockWithConnectorByFund(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "2000000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `1000000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(90498.756211, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": `1000000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(90498.7562, precision, symbol),
                "contract": name
            });
        });

        describe('unlock with connector balance', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exunlockSync(name, fmt(1000, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91498.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1001900.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(9000.0000, precision, symbol),
                    "reserve_connector_balance": "8100.0000 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91498.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(9000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exunlockSync(name, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91598.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1002079.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8900.0000, precision, symbol),
                    "reserve_connector_balance": "7921.0000 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91598.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8900.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exunlockSync(name, fmt(10, precision, symbol, name), createTime, fmt(10, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91608.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1002096.7901 ${connector_symbol}`,
                    "reserve_supply": fmt(8890.0000, precision, symbol),
                    "reserve_connector_balance": "7903.2099 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91608.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8890.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });
        });
    });
};

function SmartTokenForSixUnlockWithConnectorByFund(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "2000000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `1000000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(90498.756211, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": `1000000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(90498.756211, precision, symbol),
                "contract": name
            });
        });

        describe('unlock with connector balance', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exunlockSync(name, fmt(1000, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91498.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1001900.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(9000.0000, precision, symbol),
                    "reserve_connector_balance": "8100.0000 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91498.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(9000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exunlockSync(name, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91598.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1002079.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8900.0000, precision, symbol),
                    "reserve_connector_balance": "7921.0000 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91598.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8900.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exunlockSync(name, fmt(10, precision, symbol, name), createTime, fmt(10, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91608.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1002096.7901 ${connector_symbol}`,
                    "reserve_supply": fmt(8890.0000, precision, symbol),
                    "reserve_connector_balance": "7903.2099 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91608.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8890.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });
        });
    });
};

function SmartTokenForFourUnlockWithPartialTokensByFund(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "1000010.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `1000000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(90498.756211, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": `1000000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(90498.7562, precision, symbol),
                "contract": name
            });
        });

        describe('unlock with connector balance and locked tokens', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(90498.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exunlockSync(name, fmt(1000, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91498.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000010.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8896.7200, precision, symbol),
                    "reserve_connector_balance": "7915.1644 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91498.7562, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, null);
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8896.7200, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                let r = ctx.extransferSync("fibos", name, `10.0000 FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                    authorization: "fibos"
                });

                r = ctx.exunlockSync(name, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91598.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000020.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8787.6078, precision, symbol),
                    "reserve_connector_balance": "7722.2060 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91598.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8787.6078, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.extransferSync("fibos", name, `10.0000 FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                    authorization: "fibos"
                });

                r = ctx.exunlockSync(name, fmt(10, precision, symbol, name), createTime, fmt(10, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91608.7562, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000030.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8777.1949, precision, symbol),
                    "reserve_connector_balance": "7703.9142 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91608.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8777.1949, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });
        });
    });
};

function SmartTokenForSixUnlockWithPartialTokensByFund(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "1000010.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `1000000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(90498.756211, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": `1000000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(90498.756211, precision, symbol),
                "contract": name
            });
        });

        describe('unlock with connector balance and locked tokens', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(90498.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exunlockSync(name, fmt(1000, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91498.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000010.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8896.719907, precision, symbol),
                    "reserve_connector_balance": "7915.1626 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91498.756211, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, null);
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8896.719907, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                let r = ctx.extransferSync("fibos", name, `10.0000 FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                    authorization: "fibos"
                });

                r = ctx.exunlockSync(name, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91598.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000020.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8787.607639, precision, symbol),
                    "reserve_connector_balance": "7722.2048 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91598.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8787.607639, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.extransferSync("fibos", name, `10.0000 FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                    authorization: "fibos"
                });

                r = ctx.exunlockSync(name, fmt(10, precision, symbol, name), createTime, fmt(10, precision, symbol, name), {
                    authorization: name
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(91608.756211, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `1000030.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(8777.194729, precision, symbol),
                    "reserve_connector_balance": "7703.9148 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(91608.756211, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(8777.194729, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), null);
            });
        });
    });
};

function SmartTokenForFourCannotUnlock(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 FO";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.excreateSync("eosio", `1000000000.0000 FO`, 0, `1000000000.0000 FO`, `100000.0000 FO`, `1000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `10000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "1000000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
                authorization: "fibos"
            });
        });


        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 0.5, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });
            createTime = now;
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(0, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": connector_weight,
                "connector_balance": connector_balance,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(10000, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        describe('isufficient connector balance should not unlock by holder', () => {
            it('exunlock 1', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });

                let r = ctx.exlocktransSync(name, name1, fmt(1, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                assert.throws(() => {
                    r = ctx.exunlockSync(name1, fmt(1, precision, symbol, name), createTime, fmt(1, precision, symbol, name), {
                        authorization: name1
                    });
                });

                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(0.0000, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `0.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(10000.0000, precision, symbol),
                    "reserve_connector_balance": "10000.0000 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, null);
                checkaccount(fibos, name1, symbol, name, null);
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(9999.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
            });

            it('exunlock 999', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(name, name1, fmt(999, precision, symbol, name), parseDate(createTime), parseDate(createTime), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                r = test_util.exchange(fibos, name, `10.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
                assert.equal(r.processed.action_traces[0].console, "");

                assert.throws(() => {
                    r = ctx.exunlockSync(name1, fmt(1000, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                        authorization: name1
                    });
                });

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(4.9987, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `10.0000 ${connector_symbol}`,
                    "reserve_supply": fmt(10000.0000, precision, symbol),
                    "reserve_connector_balance": "10000.0000 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(4.9987, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, null);
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(9000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
            });
        });

        describe('isufficient connector balance should not unlock by fund', () => {
            it('exunlock 1', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(9000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                let r = test_util.exchange(fibos, name, fmt(4.9987, precision, symbol, name), `0.0000 ${connector_symbol}@eosio`, `exchange ${connector_symbol} to ${symbol}@${name}`)
                r = ctx.extransferSync(name, name1, "999999.9998 FO@eosio", "transfer");
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                assert.throws(() => {
                    r = ctx.exunlockSync(name, fmt(1, precision, symbol, name), createTime, fmt(1, precision, symbol, name), {
                        authorization: name
                    });
                });

                assert.equal(r.processed.action_traces[0].console, "");

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(0.0000, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `0.0002 ${connector_symbol}`,
                    "reserve_supply": fmt(10000.0000, precision, symbol),
                    "reserve_connector_balance": "10000.0000 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": "0.0000 AAA",
                    "contract": "user1"
                });
                checkaccount(fibos, name1, symbol, name, null);
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(9000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
            });

            it('exunlock 999', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.extransferSync(name1, name, "10.0000 FO@eosio", "transfer");
                r = test_util.exchange(fibos, name, `10.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
                assert.equal(r.processed.action_traces[0].console, "");

                assert.throws(() => {
                    r = ctx.exunlockSync(name1, fmt(1000, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                        authorization: name1
                    });
                });

                checkstat(fibos, name, symbol, name, {
                    "supply": fmt(4.9987, precision, symbol),
                    "max_supply": max_supply,
                    "issuer": name,
                    "max_exchange": max_exchange,
                    "connector_weight": "0.50000000000000000",
                    "connector_balance": `10.0002 ${connector_symbol}`,
                    "reserve_supply": fmt(10000.0000, precision, symbol),
                    "reserve_connector_balance": "10000.0000 FO",
                    "connector_balance_issuer": "eosio",
                    "buy_fee": "0.00000000000000000",
                    "sell_fee": "0.00000000000000000",
                    "position": 1
                });
                checkaccount(fibos, name, symbol, name, {
                    "quantity": fmt(4.9987, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, null);
                checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(9000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(createTime), {
                    "balance": {
                        "quantity": fmt(1000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(createTime)
                });
            });
        });
    });
};

function FOUnlockWithLockedTokensByHolders(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 EOS";
        let createTime = fmtDate();
        let sell_fee = "0.00000000000000000";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            r = ctx.excreateSync("eosio", "100000000.0000 FO", 0, "100000000.0000 FO", `10000.0000 FO`, `10000.0000 EOS`, fmtDate(0), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
        });

        describe('unlock with locked tokens', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                ctx.issueSync(fund, `10000000.0000 FO`, `issue 10000000.0000 FO`, {
                    authorization: "eosio"
                });
                let r = ctx.exlocktransSync(fund, name1, fmt(1000, precision, symbol, name), parseDate(0), parseDate(0), "lock trans");
                r = ctx.extransferSync(fund, name1, fmt(90498.7562, precision, symbol, name), `transfer`, {
                    authorization: fund
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(1000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                r = ctx.exunlockSync(name1, fmt(1000, precision, symbol, name), parseDate(0), fmt(1000, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");
                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(9909501.2438, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91498.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(9000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(fund, name1, fmt(100, precision, symbol, name), parseDate(0), parseDate(0), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(100, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });

                r = ctx.exunlockSync(name1, fmt(100, precision, symbol, name), parseDate(0), fmt(1000, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(9909501.2438, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91598.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8900.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(fund, name1, fmt(10, precision, symbol, name), parseDate(0), parseDate(0), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(10, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });

                r = ctx.exunlockSync(name1, fmt(10, precision, symbol, name), parseDate(0), fmt(10, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(9909501.2438, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91608.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8890.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });
        });
    });
};

function FOUnlockWithTokensByHolders(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();

    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 EOS";
        let sell_fee = "0.00000000000000000";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            r = ctx.excreateSync("eosio", "100000000.0000 FO", 0, "100000000.0000 FO", `10000.0000 FO`, `10000.0000 EOS`, fmtDate(0), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
        });

        describe('unlock with locked tokens', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                ctx.issueSync(fund, `10000000.0000 FO`, `issue 100.0000 FO`, {
                    authorization: "eosio"
                });
                let r = ctx.exlocktransSync(fund, name1, fmt(1000, precision, symbol, name), parseDate(0), parseDate(0), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(1000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });

                r = ctx.exunlockSync(name1, fmt(1000, precision, symbol, name), parseDate(0), fmt(1000, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(10000000.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(1000.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(9000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(fund, name1, fmt(100, precision, symbol, name), parseDate(0), parseDate(0), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(100, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });

                r = ctx.exunlockSync(name1, fmt(100, precision, symbol, name), 0, fmt(1000, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(10000000.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(1100.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8900.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });

                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(fund, name1, fmt(10, precision, symbol, name), parseDate(0), parseDate(0), "lock trans");
                checklockaccount(fibos, name1, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(10, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });

                r = ctx.exunlockSync(name1, fmt(10, precision, symbol, name), 0, fmt(10, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(10000000.0000, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(1110.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8890.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });
        });
    });
};

function FOUnlockWithPartialTokensByHolders(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 EOS";
        let sell_fee = "0.00000000000000000";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            r = ctx.excreateSync("eosio", "100000000.0000 FO", 0, "100000000.0000 FO", `10000.0000 FO`, `10000.0000 EOS`, fmtDate(0), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
        });

        describe('unlock with tokens and locked tokens', () => {
            it('exunlock 1100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                let r = ctx.issueSync(fund, `10000000.0000 FO`, `issue 100.0000 FO`, {
                    authorization: "eosio"
                });
                r = ctx.exlocktransSync(fund, name1, fmt(1100, precision, symbol, name), parseDate(0), parseDate(0), "lock trans");
                r = ctx.extransferSync(fund, name1, fmt(90398.7562, precision, symbol, name), `transfer`, {
                    authorization: fund
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(1100, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8900, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(9909601.2438, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(90398.7562, precision, symbol),
                    "contract": name
                });

                r = ctx.exunlockSync(name1, fmt(1100, precision, symbol, name), 0, fmt(1100, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": "9909601.2438 FO",
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91498.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8900.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });

            it('exunlock 110', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exlocktransSync(fund, name1, fmt(110, precision, symbol, name), parseDate(0), parseDate(0), "lock trans");
                r = ctx.extransferSync(name1, fund, fmt(10.0000, precision, symbol, name), `transfer`, {
                    authorization: name1
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(110, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(9909611.2438, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91488.7562, precision, symbol),
                    "contract": name
                });

                r = ctx.exunlockSync(name1, fmt(110, precision, symbol, name), 0, fmt(110, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": "9909611.2438 FO",
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91598.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8790.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });

            it('exunlock 11', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                let r = ctx.exlocktransSync(fund, name1, fmt(11, precision, symbol, name), parseDate(0), parseDate(0), "lock trans");
                r = ctx.extransferSync(name1, fund, fmt(1.0000, precision, symbol, name), `transfer`, {
                    authorization: name1
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(11, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(9909612.2438, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91597.7562, precision, symbol),
                    "contract": name
                });

                r = ctx.exunlockSync(name1, fmt(11, precision, symbol, name), 0, fmt(11, precision, symbol, name), {
                    authorization: name1
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": "9909612.2438 FO",
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, {
                    "quantity": fmt(91608.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8779.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });
        });
    });
};

function FOUnlockWithLockedTokensByFund(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 EOS";
        let sell_fee = "0.00000000000000000";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            r = ctx.excreateSync("eosio", "100000000.0000 FO", 0, "100000000.0000 FO", `10000.0000 FO`, `10000.0000 EOS`, fmtDate(0), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
        });

        describe('unlock with locked tokens', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                let r = ctx.issueSync(fund, `10000000.0000 FO`, `issue 100.0000 FO`, {
                    authorization: "eosio"
                });
                r = ctx.exunlockSync(fund, fmt(1000, precision, symbol, name), 0, fmt(1000, precision, symbol, name), {
                    authorization: fund
                });

                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(10001000.000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(9000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exunlockSync(fund, fmt(100, precision, symbol, name), 0, fmt(1000, precision, symbol, name), {
                    authorization: fund
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(10001100.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8900.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exunlockSync(fund, fmt(10, precision, symbol, name), 0, fmt(10, precision, symbol, name), {
                    authorization: fund
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(10001110.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8890.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });
        });
    });
};

function FOUnlockWithConnectorByFund(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 EOS";
        let sell_fee = "0.00000000000000000";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            r = ctx.excreateSync("eosio", "100000000.0000 FO", 0, "100000000.0000 FO", `10000.0000 FO`, `10000.0000 EOS`, fmtDate(0), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
        });

        describe('unlock with connector balance', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });

                let r = ctx.exunlockSync(fund, fmt(1000, precision, symbol, name), 0, fmt(1000, precision, symbol, name), {
                    authorization: fund
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(1000.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(9000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exunlockSync(fund, fmt(100, precision, symbol, name), 0, fmt(1000, precision, symbol, name), {
                    authorization: fund
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(1100.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8900.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.exunlockSync(fund, fmt(10, precision, symbol, name), 0, fmt(10, precision, symbol, name), {
                    authorization: fund
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(1110.0000, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8890.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });
        });
    });
};

function FOUnlockWithPartialTokensByFund(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(100000000, precision, symbol);
        let max_exchange = fmt(100000000, precision, symbol);
        let connector_weight = "0.50000000000000000";
        let reserve_supply = fmt(10000, precision, symbol);
        let reserve_connector_balance = "10000.0000 EOS";
        let sell_fee = "0.00000000000000000";

        before(() => {
            name = contract;
            fund = 'fibos';
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
                fund = contract;
            }
            name1 = test_util.user(fibos, name1);
            ctx = fibos.contractSync("eosio.token");

            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });

            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            r = ctx.excreateSync("eosio", "100000000.0000 FO", 0, "100000000.0000 FO", `10000.0000 FO`, `10000.0000 EOS`, fmtDate(0), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
        });

        describe('unlock with connector balance and locked tokens', () => {
            it('exunlock 1000', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                let r = ctx.issueSync(fund, "90498.7562 FO", "issue fo", {
                    authorization: name
                });
                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(90498.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(10000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });

                r = ctx.exunlockSync(fund, fmt(1000, precision, symbol, name), 0, fmt(1000, precision, symbol, name), {
                    authorization: fund
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(91498.7562, precision, symbol),
                    "contract": name
                });
                checkaccount(fibos, name1, symbol, name, null);
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(9000.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });

            it('exunlock 100', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");
                let r = ctx.issueSync("fibos", `10.0000 EOS`, `issue 10.0000 EOS`, {
                    authorization: "eosio"
                });

                r = ctx.exunlockSync(fund, fmt(100, precision, symbol, name), 0, fmt(1000, precision, symbol, name), {
                    authorization: fund
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(91598.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8900.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });

            it('exunlock 10', () => {
                coroutine.sleep(2000);
                ctx = fibos.contractSync("eosio.token");

                let r = ctx.issueSync("fibos", `10.0000 EOS`, `issue 10.0000 EOS`, {
                    authorization: "eosio"
                });

                r = ctx.exunlockSync(fund, fmt(10, precision, symbol, name), 0, fmt(10, precision, symbol, name), {
                    authorization: fund
                });
                assert.equal(r.processed.action_traces[0].console, "");

                checkaccount(fibos, fund, symbol, name, {
                    "quantity": fmt(91608.7562, precision, symbol),
                    "contract": name
                });
                checklockaccount(fibos, fund, symbol, name, parseDate(0), {
                    "balance": {
                        "quantity": fmt(8890.0000, precision, symbol),
                        "contract": name
                    },
                    "lock_timestamp": parseDate(0)
                });
                checklockaccount(fibos, name1, symbol, name, parseDate(0), null);
            });
        });
    });
};

SmartTokenForFourUnlockWithLockedTokensByHolders('AAA', 'user1', 'FO', 4);
SmartTokenForSixUnlockWithLockedTokensByHolders('AAA', 'user1', 'FO', 6);
SmartTokenForFourUnlockWithTokensByHolders('AAA', 'user1', 'FO', 4);
SmartTokenForSixUnlockWithTokensByHolders('AAA', 'user1', 'FO', 6);
SmartTokenForFourUnlockWithPartialTokensByHolders('AAA', 'user1', 'FO', 4);
SmartTokenForSixUnlockWithPartialTokensByHolders('AAA', 'user1', 'FO', 6);
SmartTokenForFourUnlockWithLockedTokensByFund('AAA', 'user1', 'FO', 4);
SmartTokenForSixUnlockWithLockedTokensByFund('AAA', 'user1', 'FO', 6);
SmartTokenForFourUnlockWithConnectorByFund('AAA', 'user1', 'FO', 4);
SmartTokenForSixUnlockWithConnectorByFund('AAA', 'user1', 'FO', 6);
SmartTokenForFourUnlockWithPartialTokensByFund('AAA', 'user1', 'FO', 4);
SmartTokenForSixUnlockWithPartialTokensByFund('AAA', 'user1', 'FO', 6);
SmartTokenForFourCannotUnlock('AAA', 'user1', 'FO', 4);
FOUnlockWithLockedTokensByHolders('FO', 'eosio', 'EOS', 4);
FOUnlockWithTokensByHolders('FO', 'eosio', 'EOS', 4);
FOUnlockWithPartialTokensByHolders('FO', 'eosio', 'EOS', 4);
FOUnlockWithLockedTokensByFund('FO', 'eosio', 'EOS', 4);
FOUnlockWithConnectorByFund('FO', 'eosio', 'EOS', 4);
FOUnlockWithPartialTokensByFund('FO', 'eosio', 'EOS', 4);

require.main === module && test.run(console.DEBUG);