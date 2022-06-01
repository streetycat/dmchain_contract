let test = require('test');
test.setup();

let test_util = require('../test_util');

let checkaccount = test_util.checkaccount;
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let precision = 4;
let symbol = "AAA";
let symbol2 = "BBB";
let symbol3 = "CCC";
let symbol4 = "DDD";
let symbol_eee = "EEE";
let contract = "user1";

test_util.runBIOS();
describe(`Parameter check setexchangefee`, () => {
    let ctx, name, name1, fund;
    let max_supply = fmt(10000000, precision, symbol);
    let max_exchange = fmt(10000000, precision, symbol);
    let reserve_supply = fmt(500000, precision, symbol);
    let reserve_connector_balance = "10000.0000 FO";

    let max_supply2 = fmt(10000000, precision, symbol2);
    let max_exchange2 = fmt(10000000, precision, symbol2);
    let reserve_supply2 = fmt(500000, precision, symbol2);
    let reserve_connector_balance2 = "10000.0000 FO";

    let max_supply3 = fmt(10000000, precision, symbol3);
    let max_exchange3 = fmt(10000000, precision, symbol3);
    let reserve_supply3 = fmt(10000, precision, symbol3);
    let reserve_connector_balance3 = "1.0000 FO";

    let max_supply4 = fmt(10000000, precision, symbol4);
    let max_exchange4 = fmt(10000000, precision, symbol4);
    let reserve_supply4 = fmt(10000, precision, symbol4);
    let reserve_connector_balance4 = "100.0000 FO";

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
        let transfer_amount = "8000.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        transfer_amount = "1000.0000";
        ctx.extransferSync("fibos", name1, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}`, {
            authorization: "fibos"
        });
    });

    it(`invalid entrance feerate(>1)`, () => {
        assert.throws(() => {
            ctx.excreateSync(name, max_supply, 0.2, max_exchange, reserve_supply, reserve_connector_balance, fmtDate(), 1.00001, 0, 'eosio', {
                authorization: name
            });
        });
    });

    it(`invalid eit feerate(>1)`, () => {
        assert.throws(() => {
            ctx.excreateSync(name, max_supply, 0.2, max_exchange, reserve_supply, reserve_connector_balance, fmtDate(), 0, 1.00001, 'eosio', {
                authorization: name
            });
        });
    });

    it(`excreate token ${symbol} and ${symbol2}`, () => {
        ctx.excreateSync(name, max_supply, 0.2, max_exchange, reserve_supply, reserve_connector_balance, fmtDate(), 0.1, 0.1, 'eosio', {
            authorization: name
        })
        ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
            authorization: name
        });
        test_util.checkstat(fibos, name, symbol, contract, {
            "supply": `0.0000 ${symbol}`,
            "max_supply": `10000000.0000 ${symbol}`,
            "issuer": name,
            "max_exchange": `10000000.0000 ${symbol}`,
            "connector_weight": "0.20000000000000001",
            "connector_balance": "0.0000 FO",
            "reserve_supply": `500000.0000 ${symbol}`,
            "reserve_connector_balance": "10000.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.10000000000000001",
            "sell_fee": "0.10000000000000001",
            "position": 1
        });
        ctx.excreateSync(name, max_supply2, 0.2, max_exchange2, reserve_supply2, reserve_connector_balance2, fmtDate(), 0.1, 0.1, 'eosio', {
            authorization: name
        })
        ctx.setpositionSync(fmt(1000000000, 4, symbol2, name), 1, "setposition", {
            authorization: name
        });
        ctx.excreateSync(name, max_supply3, 0.2, max_exchange3, reserve_supply3, reserve_connector_balance3, fmtDate(), 0.1, 0.1, 'eosio', {
            authorization: name
        })
        ctx.setpositionSync(fmt(1000000000, 4, symbol3, name), 1, "setposition", {
            authorization: name
        });

        ctx.excreateSync(name, max_supply4, 0.2, max_exchange4, reserve_supply4, reserve_connector_balance4, fmtDate(), 0.2, 0.3, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol4, name), 1, "setposition", {
            authorization: name
        });
    });

    it(`FO to ${symbol}`, () => {
        test_util.exchange(fibos, name1, `1000.0000 FO@eosio`, fmt(0, 4, symbol, name), `exchange FO to ${symbol}`)
        checkaccount(fibos, name, symbol, name, {
            "quantity": "962.2438 AAA",
            "contract": name
        });
        checkaccount(fibos, name1, symbol, name, {
            "quantity": "8660.1944 AAA",
            "contract": name
        });
        checkaccount(fibos, name1, "FO", "eosio", {
            "quantity": "0.0000 FO",
            "contract": "eosio"
        });
    })

    it(`${symbol} to FO`, () => {
        test_util.exchange(fibos, name1, fmt(8000, precision, symbol, name), `0.0000 FO@eosio`, `exchange ${symbol} to FO`)
        checkaccount(fibos, name, symbol, name, {
            "quantity": "1762.2438 AAA",
            "contract": name
        });
        checkaccount(fibos, name1, symbol, name, {
            "quantity": "660.1944 AAA",
            "contract": name
        });
        //test_util.checkstat(fibos, 'eosio', 'FO', 'eosio', null)
        checkaccount(fibos, name1, "FO", "eosio", {
            "quantity": "755.3974 FO",
            "contract": "eosio"
        });
    })

    it(`FO to ${symbol3}`, () => {
        let transfer_amount = "1000.0000";
        ctx.extransferSync("fibos", name1, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}`, {
            authorization: "fibos"
        });
        test_util.exchange(fibos, name1, `1000.0000 FO@eosio`, fmt(0, 4, symbol4, name), `exchange FO to ${symbol4}`)
        checkaccount(fibos, name, symbol4, name, {
            "quantity": "1230.7885 DDD",
            "contract": name
        });
        checkaccount(fibos, name1, symbol4, name, {
            "quantity": "4923.1541 DDD",
            "contract": name
        });
    })

    it(`${symbol4} to FO`, () => {
        test_util.exchange(fibos, name1, fmt(2000, precision, symbol4, name), `0.0000 FO@eosio`, `exchange ${symbol4} to FO`)
        checkaccount(fibos, name, symbol4, name, {
            "quantity": "1830.7885 DDD",
            "contract": name
        });
        checkaccount(fibos, name1, symbol4, name, {
            "quantity": "2923.1541 DDD",
            "contract": name
        });
    })

    it("invaild amount", () => {
        test_util.exchange(fibos, name1, `0.0001 FO@eosio`, fmt(0, precision, symbol3, name), `exchange ${symbol3} to FO`)
        test_util.exchange(fibos, name1, `1.0000 FO@eosio`, fmt(0, precision, symbol3, name), `exchange FO to ${symbol3}`)
        assert.throws(() => {
            test_util.exchange(fibos, name1, fmt(0.0001, precision, symbol3, name), `0.0000 FO@eosio`, `exchange FO to ${symbol3}`)
        });
    });

    it("check buy fee with minimum amount", () => {
        let max_supply_eee = fmt(10000000, precision, symbol_eee);
        let max_exchange_eee = fmt(10000000, precision, symbol_eee);
        let reserve_supply_eee = fmt(500000, precision, symbol_eee);
        let reserve_connector_balance_eee = fmt(500000, precision, "FO");

        ctx.excreateSync(name, max_supply_eee, 1, max_exchange_eee, reserve_supply_eee, reserve_connector_balance_eee, fmtDate(), 0.1, 0.2, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(0, 4, symbol_eee, name), 1, "setposition", {
            authorization: name
        });
        test_util.exchange(fibos, name1, fmt(0.0001, precision, "FO", "eosio"), fmt(0, 4, symbol_eee, name), `exchange FO to ${symbol_eee}`)
        checkaccount(fibos, name1, symbol_eee, name, {
            "quantity": "0.0001 EEE",
            "contract": "user1"
        });
        checkaccount(fibos, name, symbol_eee, name, {
            "quantity": "0.0000 EEE",
            "contract": name
        });
        test_util.exchange(fibos, name1, fmt(0.0002, precision, "FO", "eosio"), fmt(0, 4, symbol_eee, name), `exchange FO to ${symbol_eee}`)
    });

    it("check sell fee with minimum amount", () => {
        checkaccount(fibos, name1, symbol_eee, name, {
            "quantity": "0.0003 EEE",
            "contract": "user1"
        });
        checkaccount(fibos, name, symbol_eee, name, {
            "quantity": "0.0000 EEE",
            "contract": name
        });
    });
});

require.main === module && test.run(console.DEBUG);
