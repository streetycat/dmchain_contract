let test = require('test');
test.setup();

let test_util = require('../test_util');
let fs = require("fs");
test_util.runBIOS();
var path = require('path');
let fmt = test_util.fmt;
let checkvoterecord = test_util.checkvoterecord;
let checkbonusrate = test_util.checkbonusrate;
let getupdatetime = test_util.getupdatetime;
let calbonus = test_util.calbonus;
let fmtDate = test_util.fmtDate;
let fillnum = test_util.fillnum;
let claimable = 0;
let now;
const coroutine = require("coroutine");
var users = {};

describe(`vote bonus`, () => {
    let symbol = "AAA";
    let contract = "user1"
    let fibos, ctx, name, name1, ctx_sys, name2;
    let precision = 4;

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
            test_util.user(fibos, name);
        }
        ctx = fibos.contractSync("eosio.token");

        ctx.excreateSync("eosio", `1000000000000.0000 FO`, 0, `1000000000000.0000 FO`, `10000000000.0000 FO`, `100000000000.0000 EOS`, 0, 0, 0, 'eosio', {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.issueSync("fibos", `100000000000.0000 FO`, `issue FO`, {
            authorization: "eosio"
        });
        ctx.exlockSync("fibos", "1000000000.0000 FO@eosio", 0, {
            authorization: "fibos"
        });
        ctx.extransferSync('fibos', 'eosio', '10000.0000 FO@eosio', 'extransfer');

        let transfer_amount = "4000000000.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `extransfer FO`, {
            authorization: "fibos"
        });
        now = fmtDate();
        ctx.excreateSync(name, fmt(100000000000, precision, symbol), 0.5, fmt(100000000000, precision, symbol), fmt(300000000, precision, symbol), fmt(1000000, 4, "FO"), now, 0, 0, 'eosio', {
            authorization: name
        });
        ctx.setpositionSync(fmt(1000000000, 4, symbol, name), 1, "setposition", {
            authorization: name
        });
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
        ctx_sys.regproducerSync(name, "FO6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV", "dev.fo", 1, {
            authorization: name
        });
        ctx.exlocktransSync("fibos", "eosio.stake", "1000000.0000 FO@eosio", 0, 0, `locktrans`, {
            authorization: "fibos"
        });
        ctx.extransferSync("fibos", name1, "100000.0000 FO@eosio", `exchange FO to ${name1}`, {
            authorization: "fibos"
        });
    });
    /**
     * 运行测试用例之前，需要修改下列参数，方可顺利运行
     * fibos.contracts/eosio.system/src/producer_pay.cpp 中
     * const int64_t min_activated_stake = 150'000'000'0000 改为 0
     */
    it(`rate record table should not be empty`, () => {
        checkbonusrate(fibos, 0.2);
    });

    it(`not voted -> delegatebw will not create record`, () => {
        ctx_sys.delegatebwSync(name1, name1, "25.0000 FO", "25.0000 FO", 0, {
            authorization: name1
        });
        checkvoterecord(fibos, name1, null);
    });

    it(`not voted claimbonus not increase claimable`, () => {
        coroutine.sleep(2000);
        assert.throws(() => {
            ctx_sys.claimbonusSync(name1, {
                authorization: name1
            });
        });
    })

    it(`not voted -> undelegatebw will not create record`, () => {
        ctx_sys.undelegatebwSync(name1, name1, "25.0000 FO", "25.0000 FO", {
            authorization: name1
        });
        checkvoterecord(fibos, name1, null);
    });

    it(`not votted -> proxy vote will not create table`, () => {
        ctx_sys.delegatebwSync(name1, name1, "25.0000 FO", "25.0000 FO", 0, {
            authorization: name1
        });
        ctx_sys.buyramSync(name1, name, "100.0000 FO");
        ctx_sys.delegatebwSync(name, name, "25.0000 FO", "25.0000 FO", 0, {
            authorization: name
        });
        ctx_sys.voteproducerSync(name, "", [name].sort(), {
            authorization: name
        })
        ctx_sys.regproxySync(name, 1, {
            authorization: name
        });
        ctx_sys.voteproducerSync(name1, name, [], {
            authorization: name1
        });
        checkvoterecord(fibos, name1, null);
    });

    it(`proxy voted claimbonus not increase claimable`, () => {
        coroutine.sleep(2000);
        assert.throws(() => {
            ctx_sys.claimbonusSync(name1, {
                authorization: name1
            });
        });
    });

    it(`proxy voteed -> undelegatebw / delegatabw will not create table`, () => {
        ctx_sys.delegatebwSync(name1, name1, "25.0000 FO", "25.0000 FO", 0, {
            authorization: name1
        })
        checkvoterecord(fibos, name1, null);
        coroutine.sleep(1000);
        ctx_sys.undelegatebwSync(name1, name1, "25.0000 FO", "25.0000 FO", {
            authorization: name1
        });
        checkvoterecord(fibos, name1, null);
    });

    it(`proxy votted -> cancel proxy vote will not create table`, () => {
        ctx_sys.voteproducerSync(name1, "", [], {
            authorization: name1
        })
        checkvoterecord(fibos, name1, null);
    });

    it(`vote create table`, () => {
        ctx_sys.delegatebwSync(name1, name1, "10000.0000 FO", "10000.0000 FO", 0, {
            authorization: name1
        })
        ctx_sys.voteproducerSync(name1, "", [name], {
            authorization: name1
        });
        checkvoterecord(fibos, name1, {
            "owner": name1,
            "claimable": `0.0000 FO`
        });
    });

    it(`voted and delegatebw update claimalbe and time`, () => {
        let time = getupdatetime(fibos, name1);
        coroutine.sleep(2000);
        ctx_sys.delegatebwSync(name1, name1, "1.0000 FO", "1.0000 FO", 0, {
            authorization: name1
        });
        claimable = calbonus(fibos, name1, time, claimable);
        checkvoterecord(fibos, name1, {
            "owner": name1,
            "claimable": `${fillnum(claimable, 4)} FO`
        });
    });

    it(`voted and undelegatebw update claimalbe and time`, () => {
        let time = getupdatetime(fibos, name1);
        coroutine.sleep(2000);
        ctx_sys.undelegatebwSync(name1, name1, "1.0000 FO", "1.0000 FO", {
            authorization: name1
        });
        claimable = calbonus(fibos, name1, time, claimable);
        checkvoterecord(fibos, name1, {
            "owner": name1,
            "claimable": `${fillnum(claimable, 4)} FO`
        });
    });

    it(`voted -> unvoted update claimalbe and time`, () => {
        coroutine.sleep(2000);
        let time = getupdatetime(fibos, name1);
        ctx_sys.voteproducerSync(name1, "", [], {
            authorization: name1
        });
        claimable = calbonus(fibos, name1, time, claimable);
        checkvoterecord(fibos, name1, {
            "owner": name1,
            "claimable": `${fillnum(claimable, 4)} FO`
        });
    });

    it(`unvoted -> voted not update claimable`, () => {
        coroutine.sleep(2000);
        ctx_sys.voteproducerSync(name1, "", [name], {
            authorization: name1
        });
        checkvoterecord(fibos, name1, {
            "owner": name1,
            "claimable": `${fillnum(claimable, 4)} FO`
        });
    });

    it(`voted -> proxy voted update claimalbe and time`, () => {
        coroutine.sleep(2000);
        let time = getupdatetime(fibos, name1);
        ctx_sys.voteproducerSync(name1, name, [], {
            authorization: name1
        });
        claimable = calbonus(fibos, name1, time, claimable);
        checkvoterecord(fibos, name1, {
            "owner": name1,
            "claimable": `${fillnum(claimable, 4)} FO`
        });
    });

    it(`proxy voted -> voted not update`, () => {
        coroutine.sleep(2000);
        ctx_sys.voteproducerSync(name1, "", [name], {
            authorization: name1
        });
        checkvoterecord(fibos, name1, {
            "owner": name1,
            "claimable": `${fillnum(claimable, 4)} FO`
        });
    });

    it(`cancel voted and claimbouns not update claimable`, () => {
        coroutine.sleep(2000);
        let time = getupdatetime(fibos, name1);
        ctx_sys.voteproducerSync(name1, "", [], {
            authorization: name1
        });
        claimable = calbonus(fibos, name1, time, claimable);
        checkvoterecord(fibos, name1, {
            "owner": name1,
            "claimable": `${fillnum(claimable, 4)} FO`
        });
        ctx_sys.claimbonusSync(name1, {
            authorization: name1
        });
        checkvoterecord(fibos, name1, {
            "owner": name1,
            "claimable": `0.0000 FO`
        });
    });

    it(`cancel voted and claimbouns not increase claimable`, () => {
        coroutine.sleep(2000);
        assert.throws(() => {
            ctx_sys.claimbonusSync(name1, {
                authorization: name1
            });
        });
    })

    it(`voted and claimable increase claimable and update time`, () => {
        let time = getupdatetime(fibos, name1);
        ctx_sys.voteproducerSync(name1, "", [name], {
            authorization: name1
        });
        coroutine.sleep(2000);
        ctx_sys.claimbonusSync(name1, {
            authorization: name1
        });
        let newtime = getupdatetime(fibos, name1);
        assert.greaterThan(newtime, time);
        checkvoterecord(fibos, name1, {
            "owner": name1,
            "claimable": `0.0000 FO`
        });
    });

    it(`set bonus rate should work`, () => {
        ctx_sys.setbonusrateSync(0.1, {
            authorization: 'fibos'
        });
        checkbonusrate(fibos, 0.1);
    });

    it(`only fibos could set bonus rate`, () => {
        assert.throws(() => {
            ctx_sys.setbonusrateSync(0.5, {
                authorization: name
            });
        });

        assert.throws(() => {
            ctx_sys.setbonusrateSync(0.4, {
                authorization: 'eosio'
            });
        });

        checkbonusrate(fibos, 0.1);
    });

    it(`voted and delegatebw update claimalbe and time`, () => {
        let time = getupdatetime(fibos, name1);

        coroutine.sleep(2000);

        ctx_sys.voteproducerSync(name1, "", [name], {
            authorization: name1
        });

        claimable = calbonus(fibos, name1, time, 0) / 2;
        checkvoterecord(fibos, name1, {
            "owner": name1,
            "claimable": `${fillnum(claimable, 4)} FO`
        });
    });

    it(`set invalid bonus rate should throw`, () => {
        assert.throws(() => {
            ctx_sys.setbonusrateSync(-0.1, {
                authorization: 'fibos'
            });
        });
        checkbonusrate(fibos, 0.1);
    });
});

require.main === module && test.run(console.DEBUG);