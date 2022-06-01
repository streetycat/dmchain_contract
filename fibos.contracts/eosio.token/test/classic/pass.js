let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;


describe("pass", () => {
    var nametest;
    var users = {};

    before(() => {
        fibos = test_util.getFIBOS();
        nametest = test_util.user(fibos);
    })

    ClassicToken('AAA', 'haha');
    ClassicToken('EOS', 'eosio');
    ClassicToken('FO', 'eosio');
    ClassicToken('FO', 'fibos');
    ClassicToken('EOS', 'fibos');
})


function ClassicToken(symbol, contract) {
    let sell_fee = "0.00000000000000000";

    describe(`Pass ${symbol}@${contract}`, () => {
        let ctx, name, name1;

        before(() => {
            name = contract;
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
            }

            name1 = test_util.user(fibos);

            ctx = fibos.contractSync("eosio.token");
        });

        it('create', () => {
            test_util.checkstat(fibos, name, symbol, name, null);

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
        });

        it('issue', () => {
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
                "sell_fee": sell_fee,
                "position": 1
            });
            test_util.checkaccount(fibos, name, symbol, contract, {
                "quantity": `50000.0000 ${symbol}`,
                "contract": name
            });
        });

        it('retire', () => {
            let r = ctx.exretireSync(name, `10000.0000 ${symbol}@${name}`, `retire 10000.0000 ${symbol}@${name}`, {
                authorization: name
            });
            assert.equal(r.processed.action_traces[0].console, "");
            test_util.checkstat(fibos, name, symbol, contract, {
                "supply": `40000.0000 ${symbol}`,
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
            test_util.checkaccount(fibos, name, symbol, contract, {
                "quantity": `40000.0000 ${symbol}`,
                "contract": name
            });
        });

        it('transfer', () => {
            let r = ctx.extransferSync(name, name1, `10000.0000 ${symbol}@${name}`, `transfer 10000.0000 ${symbol}@${name}`, {
                authorization: name
            });
            assert.equal(r.processed.action_traces[0].console, "");
            test_util.checkaccount(fibos, name, symbol, contract, {
                "quantity": `30000.0000 ${symbol}`,
                "contract": name
            });
            test_util.checkaccount(fibos, name1, symbol, name, {
                "quantity": `10000.0000 ${symbol}`,
                "contract": name
            });
        });

        it('close', () => {
            let r = ctx.extransferSync(name1, name, `10000.0000 ${symbol}@${name}`, `transfer 10000.0000 ${symbol}@${name}`, {
                authorization: name1
            });
            assert.equal(r.processed.action_traces[0].console, "");
            test_util.checkaccount(fibos, name1, symbol, name, {
                "quantity": `0.0000 ${symbol}`,
                "contract": name
            });
            r = ctx.excloseSync(name1, `0.0000 ${symbol}@${name}`, {
                authorization: name1
            });
            assert.equal(r.processed.action_traces[0].console, "");
            test_util.checkaccount(fibos, name1, symbol, name, null);
        });

        it('destroy', () => {
            let r = ctx.exretireSync(name, `40000.0000 ${symbol}@${name}`, `retire 10000.0000 ${symbol}@${name}`, {
                authorization: name
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
            test_util.checkaccount(fibos, name, symbol, contract, {
                "quantity": `0.0000 ${symbol}`,
                "contract": name
            });

            r = ctx.exdestroySync(`0.0000 ${symbol}@${name}`, {
                authorization: name
            });
            assert.equal(r.processed.action_traces[0].console, "");
            test_util.checkstat(fibos, name, symbol, name, null);
        });
    });
}

require.main === module && test.run(console.DEBUG);