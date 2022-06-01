let test = require('test');
test.setup();

let test_util = require('../test_util');

test_util.runBIOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
var users = {};

describe("parameter_destroy", () => {

    ClassicToken('BBB', 'user1');
    ClassicToken('CCC', 'user2');
});

function ClassicToken(symbol, contract) {
    describe(`Parameter Check: exchange ${symbol}@${contract}`, () => {
        let fibos, ctx, name, name1;

        before(() => {
            fibos = test_util.getFIBOS();
            name = contract;

            if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
                users[name] = true;
                test_util.user(fibos, name);
            }

            name1 = test_util.user(fibos, name1);

            ctx = fibos.contractSync("eosio.token");

            ctx.excreateSync(name, `100000000000.0000 ${symbol}`, 0, `0.0000 ${symbol}`, `0.0000 ${symbol}`, '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
                authorization: name
            });
            ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
                authorization: name
            });

            ctx.exissueSync(name, `100.0000 ${symbol}@${name}`, `issue 50000.0000 ${symbol}@${name}`, {
                authorization: name
            });
        });

        it('retire parameter authorization', () => {
            assert.throws(() => {
                ctx.exretireSync("name123", fmt(100, 4, symbol, name), `retire 10000.0000 ${symbol}@${name}`, {
                    authorizations: name
                });
            });
        });
    });
}

require.main === module && test.run(console.DEBUG);