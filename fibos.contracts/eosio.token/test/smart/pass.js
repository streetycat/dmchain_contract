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

function SmartTokenForSix(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(10000000, precision, symbol);
        let max_exchange = fmt(10000000, precision, symbol);
        let connector_weight = "1.00000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(500, precision, symbol);
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
            ctx.excreateSync("eosio", `10000000.0000 FO`, 0, `10000000.0000 FO`, `100.0000 FO`, `10000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
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
        });

        it('exdestroy without modify time', () => {
            let now = fmtDate();
            let r = ctx.excreateSync(name, max_supply, 0.2, max_exchange, fmt(50, precision, symbol, name), reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });

            r = ctx.exlocktransSync(name, name1, fmt(20, precision, symbol, name), now, now, `transfer 100 ${symbol}@${name1}`, {
                authorization: name
            });

            r = ctx.exlocktransSync(name1, name, fmt(20, precision, symbol, name), now, now, `transfer 100 ${symbol}@${name}`, {
                authorization: name1
            });

            r = ctx.exdestroySync(fmt(0, precision, symbol, name), {
                authorization: name
            });

            checkstat(fibos, name, symbol, name, null);

            checklockaccount(fibos, fund, symbol, name, parseDate(now), null);
        });

        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 1, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
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
                    "quantity": fmt(500, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `10000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(500, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": "1.00000000000000000",
                "connector_balance": `10000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(500, precision, symbol),
                "contract": name
            });
            checkaccount(fibos, name, "FO", "eosio", {
                "quantity": "70000.0000 FO",
                "contract": "eosio"
            });
        });

        it('extransfer', () => {
            let r = ctx.extransferSync(name, name1, fmt(100, precision, symbol, name), `transfer 100 ${symbol}@${name}`, {
                authorization: name
            });
            assert.equal(r.processed.action_traces[0].console, "");

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(400, precision, symbol),
                "contract": name
            });
            checkaccount(fibos, name1, symbol, name, {
                "quantity": fmt(100, precision, symbol),
                "contract": name
            });
        });

        it('exclose', () => {
            let r = ctx.extransferSync(name1, name, fmt(100, precision, symbol, name), `transfer 100 ${symbol}@${name}`, {
                authorization: name1
            });
            assert.equal(r.processed.action_traces[0].console, "");
            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(500, precision, symbol),
                "contract": name
            });
            checkaccount(fibos, name1, symbol, name, {
                "quantity": fmt(0, precision, symbol),
                "contract": name
            });

            r = ctx.excloseSync(name1, fmt(0, precision, symbol, name), {
                authorization: name1
            });

            assert.equal(r.processed.action_traces[0].console, "");
            assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", name1, "accounts"), {
                "rows": [],
                "more": false
            });
        });

        it(`exchange to ${connector_symbol}`, () => {
            ctx = fibos.contractSync("eosio.token");

            let r = test_util.exchange(fibos, name, fmt(100, precision, symbol, name), `0.0000 ${connector_symbol}@eosio`, `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(400, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": "1.00000000000000000",
                "connector_balance": `8000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(400, precision, symbol),
                "contract": name
            });
            checkaccount(fibos, name, "FO", "eosio", {
                "quantity": `72000.0000 FO`,
                "contract": "eosio"
            });
        });

        it('exunlock', () => {
            coroutine.sleep(2000);
            ctx = fibos.contractSync("eosio.token");
            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(500, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });

            let r = ctx.exunlockSync(name, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                authorization: name
            });
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(500.000000, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": "1.00000000000000000",
                "connector_balance": `10000.0000 ${connector_symbol}`,
                "reserve_supply": fmt(400, precision, symbol),
                "reserve_connector_balance": "8000.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(500.000000, precision, symbol),
                "contract": name
            });
            checkaccount(fibos, name, "FO", "eosio", {
                "quantity": `70000.0000 FO`,
                "contract": "eosio"
            });
            checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(400, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it('lcktransfer', () => {
            let now = fmtDate();
            holderTime = now;
            let r = ctx.exlocktransSync(name, name1, fmt(100, precision, symbol, name), createTime, now, `transfer 100 ${symbol}@${name}`, {
                authorization: name
            });
            assert.equal(r.processed.action_traces[0].console, "");

            checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(300, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
            checklockaccount(fibos, name1, symbol, name, parseDate(now), {
                "balance": {
                    "quantity": fmt(100, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(now)
            });
        });

        it('exunlock by holder', () => {
            coroutine.sleep(2000);
            ctx = fibos.contractSync("eosio.token");
            let r = ctx.exunlockSync(name1, fmt(50, precision, symbol, name), holderTime, fmt(100, precision, symbol, name), {
                authorization: name1
            });
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(500.000000, precision, symbol),
                "max_supply": fmt(10000000, precision, symbol),
                "issuer": name,
                "max_exchange": fmt(10000000, precision, symbol),
                "connector_weight": "1.00000000000000000",
                "connector_balance": "10000.0000 FO",
                "reserve_supply": fmt(400, precision, symbol),
                "reserve_connector_balance": "8000.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            checklockaccount(fibos, name1, symbol, name, parseDate(holderTime), {
                "balance": {
                    "quantity": fmt(50, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(holderTime)
            });
            checkaccount(fibos, name1, symbol, name, {
                "quantity": fmt(50, precision, symbol),
                "contract": name
            });
        });

        it('lock transfer back', () => {
            ctx = fibos.contractSync("eosio.token");
            let r = ctx.exlocktransSync(name1, name, fmt(50, precision, symbol, name), holderTime, holderTime, `transfer 200 ${symbol}@${name}`, {
                authorization: name1
            });
            assert.equal(r.processed.action_traces[0].console, "");

            checklockaccount(fibos, name1, symbol, name, holderTime, null);
            checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(300, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
            checklockaccount(fibos, name, symbol, name, parseDate(holderTime), {
                "balance": {
                    "quantity": fmt(50, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(holderTime)
            });
        });

        it('exdestroy modify time', () => {
            let r = ctx.extransferSync(name1, name, fmt(50, precision, symbol, name), `transfer 50 ${symbol}@${name}`, {
                authorization: name1
            });
            assert.equal(r.processed.action_traces[0].console, "");
            ctx.exdestroySync(fmt(0, precision, symbol, name), {
                authorization: name
            });
            checkstat(fibos, name, symbol, name, null);
        });
    });
}

function SmartTokenForEight(symbol, contract, connector_symbol, precision) {
    test_util.runBIOS();
    describe(`SmartToken Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1, fund;
        let max_supply = fmt(10000000, precision, symbol);
        let max_exchange = fmt(10000000, precision, symbol);
        let connector_weight = "1.00000000000000000";
        let connector_balance = "0.0000 FO";
        let reserve_supply = fmt(500, precision, symbol);
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
            ctx.excreateSync("eosio", `10000000.0000 FO`, 0, `10000000.0000 FO`, `100.0000 FO`, `10000.0000 EOS`, fmtDate(), 0, 0, 'eosio', {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
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
        });

        it('exdestroy without modify time', () => {
            let now = fmtDate();
            let r = ctx.excreateSync(name, max_supply, 0.2, max_exchange, fmt(50, precision, symbol, name), reserve_connector_balance, now, 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });

            r = ctx.exlocktransSync(name, name1, fmt(20, precision, symbol, name), now, now, `transfer 100 ${symbol}@${name1}`, {
                authorization: name
            });

            r = ctx.exlocktransSync(name1, name, fmt(20, precision, symbol, name), now, now, `transfer 100 ${symbol}@${name}`, {
                authorization: name1
            });

            r = ctx.exdestroySync(fmt(0, precision, symbol, name), {
                authorization: name
            });

            checkstat(fibos, name, symbol, name, null);

            checklockaccount(fibos, fund, symbol, name, parseDate(now), null);
        });

        it(`excreate`, () => {
            coroutine.sleep(2000);
            let now = fmtDate();
            checkstat(fibos, name, symbol, name, null);
            let r = ctx.excreateSync(name, max_supply, 1, max_exchange, reserve_supply, reserve_connector_balance, now, 0, 0, 'eosio', {
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
                    "quantity": fmt(500, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it(`exchange from ${connector_symbol}`, () => {
            checkaccount(fibos, name, symbol, name, null);
            checkaccount(fibos, fund, symbol, name, null);

            let r = test_util.exchange(fibos, name, `10000.0000 ${connector_symbol}@eosio`, fmt(0, precision, symbol, name), `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(500, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": "1.00000000000000000",
                "connector_balance": `10000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(500, precision, symbol),
                "contract": name
            });
            checkaccount(fibos, name, "FO", "eosio", {
                "quantity": "70000.0000 FO",
                "contract": "eosio"
            });
        });

        it('extransfer', () => {
            let r = ctx.extransferSync(name, name1, fmt(100, precision, symbol, name), `transfer 100 ${symbol}@${name}`, {
                authorization: name
            });
            assert.equal(r.processed.action_traces[0].console, "");

            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(400, precision, symbol),
                "contract": name
            });
            checkaccount(fibos, name1, symbol, name, {
                "quantity": fmt(100, precision, symbol),
                "contract": name
            });
        });

        it('exclose', () => {
            let r = ctx.extransferSync(name1, name, fmt(100, precision, symbol, name), `transfer 100 ${symbol}@${name}`, {
                authorization: name1
            });
            assert.equal(r.processed.action_traces[0].console, "");
            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(500, precision, symbol),
                "contract": name
            });
            checkaccount(fibos, name1, symbol, name, {
                "quantity": fmt(0, precision, symbol),
                "contract": name
            });

            r = ctx.excloseSync(name1, fmt(0, precision, symbol, name), {
                authorization: name1
            });

            assert.equal(r.processed.action_traces[0].console, "");
            assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", name1, "accounts"), {
                "rows": [],
                "more": false
            });
        });

        it(`exchange to ${connector_symbol}`, () => {
            ctx = fibos.contractSync("eosio.token");

            let r = test_util.exchange(fibos, name, fmt(100, precision, symbol, name), `0.0000 ${connector_symbol}@eosio`, `exchange ${connector_symbol} to ${symbol}@${name}`)
            assert.equal(r.processed.action_traces[0].console, "");
            checkstat(fibos, name, symbol, name, {
                "supply": fmt(400, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": "1.00000000000000000",
                "connector_balance": `8000.0000 ${connector_symbol}`,
                "reserve_supply": reserve_supply,
                "reserve_connector_balance": reserve_connector_balance,
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(400, precision, symbol),
                "contract": name
            });
            checkaccount(fibos, name, "FO", "eosio", {
                "quantity": `72000.0000 FO`,
                "contract": "eosio"
            });
        });

        it('exunlock', () => {
            coroutine.sleep(2000);
            ctx = fibos.contractSync("eosio.token");
            checklockaccount(fibos, fund, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(500, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });

            let r = ctx.exunlockSync(name, fmt(100, precision, symbol, name), createTime, fmt(1000, precision, symbol, name), {
                authorization: name
            });
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(500.00000000, precision, symbol),
                "max_supply": max_supply,
                "issuer": name,
                "max_exchange": max_exchange,
                "connector_weight": "1.00000000000000000",
                "connector_balance": `10000.0000 ${connector_symbol}`,
                "reserve_supply": fmt(400, precision, symbol),
                "reserve_connector_balance": "8000.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(500.00000000, precision, symbol),
                "contract": name
            });
            checkaccount(fibos, name, "FO", "eosio", {
                "quantity": `70000.0000 FO`,
                "contract": "eosio"
            });
            checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(400, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
        });

        it('lcktransfer', () => {
            let now = fmtDate();
            holderTime = now;
            let r = ctx.exlocktransSync(name, name1, fmt(100, precision, symbol, name), createTime, now, `transfer 100 ${symbol}@${name}`, {
                authorization: name
            });
            assert.equal(r.processed.action_traces[0].console, "");

            checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(300, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
            checklockaccount(fibos, name1, symbol, name, parseDate(now), {
                "balance": {
                    "quantity": fmt(100, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(now)
            });
        });

        it('exunlock by holder', () => {
            coroutine.sleep(2000);
            ctx = fibos.contractSync("eosio.token");
            let r = ctx.exunlockSync(name1, fmt(50, precision, symbol, name), holderTime, fmt(100, precision, symbol, name), {
                authorization: name1
            });
            assert.equal(r.processed.action_traces[0].console, "");

            checkstat(fibos, name, symbol, name, {
                "supply": fmt(500.00000000, precision, symbol),
                "max_supply": fmt(10000000, precision, symbol),
                "issuer": name,
                "max_exchange": fmt(10000000, precision, symbol),
                "connector_weight": "1.00000000000000000",
                "connector_balance": "10000.0000 FO",
                "reserve_supply": fmt(400, precision, symbol),
                "reserve_connector_balance": "8000.0000 FO",
                "connector_balance_issuer": "eosio",
                "buy_fee": "0.00000000000000000",
                "sell_fee": "0.00000000000000000",
                "position": 1
            });
            checklockaccount(fibos, name1, symbol, name, parseDate(holderTime), {
                "balance": {
                    "quantity": fmt(50, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(holderTime)
            });
            checkaccount(fibos, name, symbol, name, {
                "quantity": fmt(450, precision, symbol),
                "contract": name
            });
            checkaccount(fibos, name1, symbol, name, {
                "quantity": fmt(50, precision, symbol),
                "contract": name
            });
        });

        it('lock transfer back', () => {
            ctx = fibos.contractSync("eosio.token");
            let r = ctx.exlocktransSync(name1, name, fmt(50, precision, symbol, name), holderTime, holderTime, `transfer 200 ${symbol}@${name}`, {
                authorization: name1
            });
            assert.equal(r.processed.action_traces[0].console, "");

            checklockaccount(fibos, name1, symbol, name, holderTime, null);
            checklockaccount(fibos, name, symbol, name, parseDate(createTime), {
                "balance": {
                    "quantity": fmt(300, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(createTime)
            });
            checklockaccount(fibos, name, symbol, name, parseDate(holderTime), {
                "balance": {
                    "quantity": fmt(50, precision, symbol),
                    "contract": name
                },
                "lock_timestamp": parseDate(holderTime)
            });
        });

        it('exdestroy modify time', () => {
            let r = ctx.extransferSync(name1, name, fmt(50, precision, symbol, name), `transfer 50 ${symbol}@${name}`, {
                authorization: name1
            });
            assert.equal(r.processed.action_traces[0].console, "");
            ctx.exdestroySync(fmt(0, precision, symbol, name), {
                authorization: name
            });
            checkstat(fibos, name, symbol, name, null);
        });
    });
}


SmartTokenForSix('AAA', 'user1', 'FO', 6);
SmartTokenForEight('BBB', 'user2', 'FO', 8);


require.main === module && test.run(console.DEBUG);
