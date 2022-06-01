let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;

describe(`Pass FO exchange`, () => {
    let ctx;
    let time_point = "1970-01-01T00:00:00";
    let name;

    before(() => {
        name = test_util.user(fibos);
        ctx = fibos.contractSync("eosio.token");
        ctx.createSync("eosio", `10000000000.0000 EOS`, {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.issueSync("fibos", `1000000000.0000 EOS`, '', {
            authorization: "eosio"
        });

        ctx.excreateSync("eosio", `100000000000.0000 FO`, 0, '10000000000.0000 FO', '100.0000 FO', '10000.0000 EOS', 0, 0, 0, 'eosio', {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });

        test_util.checkstat(fibos, "eosio", "EOS", "eosio", {
            "supply": `1000000000.0000 EOS`,
            "max_supply": `10000000000.0000 EOS`,
            "issuer": "eosio",
            "max_exchange": `0.0000 FO`,
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": `0.0000 EOS`,
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        test_util.checkaccount(fibos, "fibos", "EOS", "eosio", {
            "quantity": "1000000000.0000 EOS",
            "contract": "eosio"
        });
        test_util.checkaccount(fibos, "eosio", "EOS", "eosio", {
            "quantity": "0.0000 EOS",
            "contract": "eosio"
        });

        test_util.checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "0.0000 FO",
            "max_supply": "100000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "100.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        test_util.checkaccount(fibos, "fibos", "FO", "eosio", null);
        test_util.checkaccount(fibos, "eosio", "FO", "eosio", null);
        test_util.checklockaccount(fibos, "fibos", "FO", "eosio", time_point, {
            "balance": {
                "quantity": "100.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": time_point
        });
    });

    it('issue token', () => {
        for (var i = 0; i < 4; i++) {
            ctx.exissueSync("fibos", `50.0000 FO@eosio`, `hi${i}`, {
                authorization: "eosio"
            });
        }
        test_util.checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "200.0000 FO",
            "contract": "eosio"
        });
        test_util.checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "200.0000 FO",
            "max_supply": "100000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "100.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
    });

    it('retire token', () => {
        for (var i = 0; i < 4; i++) {
            ctx.exretireSync("fibos", `50.0000 FO@eosio`, `hi${i}`, {
                authorization: "fibos"
            });
        }
        test_util.checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "0.0000 FO",
            "contract": "eosio"
        });
        test_util.checklockaccount(fibos, "fibos", "FO", "eosio", time_point, {
            "balance": {
                "quantity": "100.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": time_point
        });
        test_util.checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "0.0000 FO",
            "max_supply": "100000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "100.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
    });

    it('unlock token', () => {
        ctx.exunlockSync("fibos", `50.0000 FO@eosio`, "1970-01-01T00:00:00", "hi", {
            authorization: "fibos"
        });
        test_util.checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "50.0000 FO",
            "contract": "eosio"
        });
        test_util.checklockaccount(fibos, "fibos", "FO", "eosio", time_point, {
            "balance": {
                "quantity": "50.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": time_point
        });
        test_util.checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "50.0000 FO",
            "max_supply": "100000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "50.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
    });

    it(`issue X@eosio by FIBOS to self`, () => {
        for (var i = 0; i < 4; i++) {
            ctx.exissueSync("fibos", `50.0000 FO@eosio`, `hi${i}`, {
                authorization: "fibos"
            });
        }
        test_util.checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "250.0000 FO",
            "contract": "eosio"
        });
        test_util.checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "250.0000 FO",
            "max_supply": "100000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "50.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
    });

    it(`issue X@eosio by FIBOS to other`, () => {
        test_util.checkaccount(fibos, name, "FO", "eosio", null);
        ctx.exissueSync(name, `50.0000 FO@eosio`, `hi~`, {
            authorization: "fibos"
        });
        test_util.checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "50.0000 FO",
            "contract": "eosio"
        });
        test_util.checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "300.0000 FO",
            "max_supply": "100000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "50.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
    });

    it(`issue X@eosio by EOS to other`, () => {
        test_util.checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "50.0000 FO",
            "contract": "eosio"
        });
        ctx.exissueSync(name, `50.0000 FO@eosio`, `hi~`, {
            authorization: "eosio"
        });
        test_util.checkaccount(fibos, name, "FO", "eosio", {
            "quantity": "100.0000 FO",
            "contract": "eosio"
        });
        test_util.checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "350.0000 FO",
            "max_supply": "100000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "50.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
    });

    it(`issue X@eosio by other should throw`, () => {
        test_util.checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "350.0000 FO",
            "max_supply": "100000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "50.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
        assert.throws(() => {
            ctx.exissueSync("fibos", `50.0000 FO@eosio`, `hi${i}`, {
                authorization: name
            });
        });
        test_util.checkaccount(fibos, "fibos", "FO", "eosio", {
            "quantity": "250.0000 FO",
            "contract": "eosio"
        });
        test_util.checkstat(fibos, "eosio", "FO", "eosio", {
            "supply": "350.0000 FO",
            "max_supply": "100000000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "0.0000 FO",
            "connector_weight": "0.00000000000000000",
            "connector_balance": "0.0000 FO",
            "reserve_supply": "50.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.00000000000000000",
            "position": 1
        });
    });
});

require.main === module && test.run(console.DEBUG);