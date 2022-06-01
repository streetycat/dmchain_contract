let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;

describe(`parameter create FO@eosio`, () => {
    let fibos, ctx, name;

    before(() => {
        fibos = test_util.getFIBOS();
        ctx = fibos.contractSync("eosio.token");
        name = test_util.user(fibos);
    });

    it('create parameter issuer', () => {
        assert.throws(() => {
            ctx.excreateSync("eosio", `100000000000.0000 FO`, 0, '10000000000.0000 FO', '100.0000 FO', '10000.0000 EOS', 0, 0, 0, 'eosio', {
                authorization: name
            });
        });
        test_util.checkstat(fibos, "eosio", "FO", "eosio", null);
        test_util.checkstat(fibos, "fibos", "FO", "eosio", null);
    })

    it('create parameter reserve_supply is negative', () => {
        assert.throws(() => {
            ctx.excreateSync("eosio", `100000000000.0000 FO`, 0, '10000000000.0000 FO', '-100.0000 FO', '10000.00000 EOS', 0, 0, 0, 'eosio', {
                authorization: "eosio"
            });
        });
        test_util.checkstat(fibos, "eosio", "FO", "eosio", null);
        test_util.checkstat(fibos, "fibos", "FO", "eosio", null);
    })

    it('create parameter reserve_supply more than max_supply', () => {
        assert.throws(() => {
            ctx.excreateSync("eosio", `100000000000.0000 FO`, 0, '10000000000.0000 FO', '1000000000000.0000 FO', '10000.00000 EOS', 0, 0, 0, 'eosio', {
                authorization: "eosio"
            });
        });
        test_util.checkstat(fibos, "eosio", "FO", "eosio", null);
        test_util.checkstat(fibos, "fibos", "FO", "eosio", null);
    })

    it('create parameter reserve_supply dismatch max_supply', () => {
        assert.throws(() => {
            ctx.excreateSync("eosio", `100000000000.0000 FO`, 0, '10000000000.0000 FO', '10000000000.0000 BBB', '10000.00000 EOS', 0, 0, 0, 'eosio', {
                authorization: "eosio"
            });
        });
        test_util.checkstat(fibos, "eosio", "FO", "eosio", null);
        test_util.checkstat(fibos, "fibos", "FO", "eosio", null);
    })

    it('create parameter connector_weight', () => {
        assert.throws(() => {
            ctx.excreateSync("eosio", `100000000000.0000 FO`, 10, '10000000000.0000 FO', '100.0000 FO', '10000.00000 EOS', 0, 0, 0, 'eosio', {
                authorization: "eosio"
            });
        });
        test_util.checkstat(fibos, "eosio", "FO", "eosio", null);
        test_util.checkstat(fibos, "fibos", "FO", "eosio", null);
    })
});

require.main === module && test.run(console.DEBUG);