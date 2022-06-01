let test = require('test');
test.setup();

let test_util = require('../test_util');
let fs = require("fs");
test_util.runBIOS();
var path = require('path');
let fmt = test_util.fmt;
let checkaccount = test_util.checkaccount;
let checklockaccount = test_util.checklockaccount;
let fmtDate = test_util.fmtDate;
let parseDate = test_util.parseDate;

let now, newTime;
var users = {};

describe(`lock delegate`, () => {
    let symbol = "AAA";
    let contract = "user1"
    let fibos, ctx, name, name1, ctx_sys;
    let precision = 4;

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
            test_util.user(fibos, name);
        }
        ctx = fibos.contractSync("eosio.token");

        ctx.createSync("eosio", "5000000000000.0000 EOS", {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.excreateSync("eosio", `1000000000000.0000 FO`, 0, `1000000000000.0000 FO`, `10000000000.0000 FO`, `100000000000.0000 EOS`, 0, 0, 0, 'eosio', {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.issueSync("fibos", `100000000000.0000 FO`, `issue FO`, {
            authorization: "eosio"
        });
        ctx.issueSync("eosio", "100000000000.0000 FO", `issue 1000000000000 FO`, {
            authorization: "eosio"
        })
        let transfer_amount = "4000000000.0000";
        ctx.extransferSync("eosio", name, `${transfer_amount} FO@eosio`, `extransfer FO`, {
            authorization: "eosio"
        });
        now = fmtDate();
        ctx.excreateSync(name, fmt(100000000000, precision, symbol), 0.5, fmt(100000000000, precision, symbol), fmt(300000000, precision, symbol), fmt(1000000, 4, "FO"), now, 0, 0, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
            authorization: name
        });
        ctx.extransferSync('fibos', 'eosio', '10000.0000 FO@eosio', 'extransfer');

        const wasm = fs.readFile(path.resolve(__dirname, `../../bin/eosio.system/eosio.system.wasm`));
        const abi = fs.readFile(path.resolve(__dirname, `../../bin/eosio.system/eosio.system.abi`));
        fibos.setcodeSync("eosio", 0, 0, wasm, {
            authorization: "eosio"
        });

        fibos.setabiSync("eosio", JSON.parse(abi), {
            authorization: "eosio"
        });

        ctx_sys = fibos.contractSync("eosio");

        name1 = test_util.user(fibos);

    });

    it(`unlocked token is insufficient`, () => {
        checkaccount(fibos, name1, "FO", "eosio", null);
        assert.throws(() => {
            ctx_sys.delegatebwSync(name1, name1, "1.0000 FO", "1.0000 FO", 0, {
                authorization: name1
            });
        });
    });

    it(`locked token abound, but unlocked token is insuffcient`, () => {
        var time = fmtDate(0);
        ctx.exlockSync(`eosio`, `10000.0000 FO@eosio`, time, "lockfo", {
            authorization: 'eosio'
        });
        newTime = fmtDate(0);
        ctx.exlocktransSync("eosio", name1, "100.0000 FO@eosio", time, newTime, `locktrans`, {
            authorization: "eosio"
        });
        checklockaccount(fibos, name1, "FO", "eosio", parseDate(newTime), {
            "balance": {
                "quantity": "100.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": parseDate(newTime)
        });
        checkaccount(fibos, name1, "FO", "eosio", null);
        assert.throws(() => {
            ctx_sys.delegatebwSync(name1, name1, "50.0000 FO", "50.0000 FO", 0, {
                authorization: name1
            });
        });
    })

    it(`unlocked token abound`, () => {
        ctx.extransferSync("eosio", name1, "100.0000 FO@eosio", `exchange FO to ${name1}`, {
            authorization: "eosio"
        });
        checklockaccount(fibos, name1, "FO", "eosio", parseDate(newTime), {
            "balance": {
                "quantity": "100.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": parseDate(newTime)
        });
        checkaccount(fibos, name1, "FO", "eosio", {
            "quantity": "100.0000 FO",
            "contract": "eosio"
        });
        ctx_sys.delegatebwSync(name1, name1, "50.0000 FO", "50.0000 FO", 0, {
            authorization: name1
        });
        checkaccount(fibos, name1, "FO", "eosio", {
            "quantity": "0.0000 FO",
            "contract": "eosio"
        });
    });

    it(`the sum of locked and unlocked token is equal to delegate`, () => {
        ctx.extransferSync("eosio", name1, "50.0000 FO@eosio", `exchange FO to ${name1}`, {
            authorization: "eosio"
        });
        checkaccount(fibos, name1, "FO", "eosio", {
            "quantity": "50.0000 FO",
            "contract": "eosio"
        });
        checklockaccount(fibos, name1, "FO", "eosio", parseDate(newTime), {
            "balance": {
                "quantity": "100.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": parseDate(newTime)
        });
        assert.throws(() => {
            ctx_sys.delegatebwSync(name1, name1, "50.0000 FO", "50.0000 FO", 0, {
                authorization: name1
            });
        });
        checkaccount(fibos, name1, "FO", "eosio", {
            "quantity": "50.0000 FO",
            "contract": "eosio"
        });
        checklockaccount(fibos, name1, "FO", "eosio", parseDate(newTime), {
            "balance": {
                "quantity": "100.0000 FO",
                "contract": "eosio"
            },
            "lock_timestamp": parseDate(newTime)
        });
    })
});

require.main === module && test.run(console.DEBUG);