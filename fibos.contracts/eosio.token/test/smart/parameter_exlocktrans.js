let test = require('test');
test.setup();

let test_util = require('../test_util');

const coroutine = require("coroutine");
test_util.runBIOS();
let fmt = test_util.fmt;
let checklockaccount = test_util.checklockaccount;
let fmtDate = test_util.fmtDate;
let parseDate = test_util.parseDate;
let now;
var users = {};

describe(`Parameter check exlocktrans`, () => {
    let symbol = "AAA";
    let contract = "user1"
    let fibos, ctx, name, name1, name2;
    let precision = 6;

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
            test_util.user(fibos, name);
        }
        name1 = test_util.user(fibos);
        name2 = test_util.user(fibos);

        ctx = fibos.contractSync("eosio.token");

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
        ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
            authorization: "eosio"
        });
        ctx.issueSync("fibos", `1000000.0000 FO`, `issue 100.0000 FO`, {
            authorization: "eosio"
        });
        let transfer_amount = "10.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `exchange FO to ${symbol}@${name}`, {
            authorization: "fibos"
        });
        now = fmtDate();
        ctx.excreateSync(name, fmt(100000000000, precision, symbol), 0.5, fmt(100000000000, precision, symbol), fmt(300000000, precision, symbol), fmt(1000000, 4, "FO"), fmtDate(), 0, 0, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
            authorization: name
        });
    });

    it(`expiration_from must less than expiration_to if token can't be unlocked`, () => {
        assert.throws(() => {
            ctx.exlocktransSync(name, name1, fmt(100, precision, symbol, name), now, "1970-01-01T00:00:00", `transfer 100 ${symbol}@${name}`, {
                authorization: name
            });
        });
    })

    it(`expiration_to can be 0 if token can be unlocked`, () => {
        coroutine.sleep(3000);
        ctx.exlocktransSync(name, name1, fmt(100, precision, symbol, name), now, "1970-01-01T00:00:00", `transfer 100 ${symbol}@${name}`, {
            authorization: name
        });
    })

    it('Non-foundation can modify expiration_to', () => {
        coroutine.sleep(2000);
        let newtime = fmtDate();
        ctx.exlocktransSync(name, name1, fmt(100, precision, symbol, name), now, newtime, `transfer 100 ${symbol}@${name}`, {
            authorization: name
        });
        let changetime = fmtDate(100);
        ctx.exlocktransSync(name1, name, fmt(100, precision, symbol, name), newtime, changetime, `transfer 100 ${symbol}@${name}`, {
            authorization: name1
        });
        checklockaccount(fibos, name, symbol, name, parseDate(newtime), null);
        checklockaccount(fibos, name, symbol, name, parseDate(changetime), {
            "balance": {
                "quantity": fmt(100, precision, symbol),
                "contract": name
            },
            "lock_timestamp": parseDate(changetime)
        });
    });

    let newtime = fmtDate(0);
    it(`symbol precision mismatch should throw`, () => {
        ctx.exlocktransSync(name, name2, fmt(50, precision, symbol, name), now, newtime, `transfer 50 ${symbol}@${name}`, {
            authorization: name
        });
        coroutine.sleep(2000);
        assert.throws(() => {
            ctx.exlocktransSync(name2, name, "100.0000 FO@eosio", newtime, 0, `exlocktrans 100 FO`, {
                authorization: name2
            })
        });
    });

    it(`under expiration time should throw`, () => {
        let newTime = "2030-11-23T00:00:00";
        ctx.exlocktransSync(name, name2, fmt(50, precision, symbol, name), now, newTime, `transfer 50 ${symbol}@${name}`, {
            authorization: name
        });
        assert.throws(() => {
            ctx.exlocktransSync(name2, name, fmt(100, precision, symbol, name), newtime, 0, `exlocktrans 100 FO`, {
                authorization: name2
            })
        });
    })

    it(`expiration_to is 0 can recursion trans`, () => {
        newtime = fmtDate(0);
        ctx.exlocktransSync(name, name2, fmt(50, precision, symbol, name), now, newtime, `transfer 50 ${symbol}@${name}`, {
            authorization: name
        });
        coroutine.sleep(2000);
        ctx.exlocktransSync(name2, name, fmt(75, precision, symbol, name), newtime, 0, `exlocktrans 75 FO`, {
            authorization: name2
        });
        checklockaccount(fibos, name2, symbol, name, parseDate(newtime), {
            "balance": {
                "quantity": fmt(25, precision, symbol),
                "contract": name
            },
            "lock_timestamp": parseDate(newtime)
        });
    })
});

require.main === module && test.run(console.DEBUG);