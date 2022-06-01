let test = require('test');
test.setup();

let test_util = require('../test_util');
let fs = require("fs");
var path = require('path');
test_util.runBIOS();
const coroutine = require("coroutine")
var users = {};

describe(`producer`, () => {
    let contract = "user1"
    let fibos, ctx, name, ctx_sys;

    before(() => {
        fibos = test_util.getFIBOS();
        name = contract;
        if (name !== 'eosio' && name !== 'fibos' && !users[name]) {
            users[name] = true;
            test_util.user(fibos, name);
        }

        name1 = test_util.user(fibos);
        ctx = fibos.contractSync("eosio.token");
        ctx.excreateSync("eosio", `10000000.0000 FO`, `100.0000 FO`, 0, {
            authorization: "eosio"
        });

        ctx.excreateSync("eosio", `1000000000 PST`, `0 PST`, 0, {
            authorization: "eosio"
        })
        ctx.excreateSync("system", `1000000000 PST`, `0 PST`, 0, {
            authorization: "system"
        })
        const wasm = fs.readFile(path.resolve(__dirname, `../../bin/eosio.system/eosio.system.wasm`));
        const abi = fs.readFile(path.resolve(__dirname, `../../bin/eosio.system/eosio.system.abi`));
        fibos.setabiSync("eosio", JSON.parse(abi), {
            authorization: "eosio"
        });
        fibos.setcodeSync("eosio", 0, 0, wasm, {
            authorization: "eosio"
        });
        ctx_sys = fibos.contractSync("eosio");
    });

    it(`check producer `, () => {
        assert.deepEqual(fibos.getTableRowsSync({
            json: true,
            code: "eosio",
            scope: "eosio",
            table: "producers",
            limit: 50
        }).rows.length, 0);

    })

    it(`issue PST@eosio to fibos, pststats do nothing`, () => {
        ctx.exissueSync("fibos", `1000000 PST@eosio`, `issue 1000000 PST`, {
            authorization: "eosio"
        });
        assert.deepEqual(fibos.getTableRowsSync({
            json: true,
            code: "eosio.token",
            scope: "eosio.token",
            table: "pststats",
        }).rows.length, 0);
    })

    it(`issue PST@system to fibos, pststats changed`, () => {
        ctx.exissueSync("fibos", `1000000 PST@system`, `issue 1000000 PST`, {
            authorization: "system"
        });
        assert.deepEqual(fibos.getTableRowsSync({
            json: true,
            code: "eosio.token",
            scope: "eosio.token",
            table: "pststats",
        }).rows[0].amount, {
            "quantity": "1000000 PST",
            "contract": "system"
        });
    })

    it(`check producer, not regproducer, do nothing`, () => {
        assert.deepEqual(fibos.getTableRowsSync({
            json: true,
            code: "eosio",
            scope: "eosio",
            table: "producers",
            limit: 50
        }).rows.length, 0);
    })

    it(`regproducer, get total_votes from eosio.token`, () => {
        ctx_sys.regproducerSync("fibos", "FO6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV", "fordmc", 1, {
            authorization: "fibos"
        });
        assert.deepEqual(fibos.getTableRowsSync({
            json: true,
            code: "eosio",
            scope: "eosio",
            table: "producers",
            limit: 50
        }).rows[0].total_votes, `1000000.00000000000000000`);
    })

    it(`issue PST@system to fibos again, check producer`, () => {
        ctx.exissueSync("fibos", `100000 PST@system`, `issue 1000000 PST`, {
            authorization: "system"
        });
        let r = fibos.getTableRowsSync({
            json: true,
            code: "eosio",
            scope: "eosio",
            table: "producers",
            limit: 50
        })
        assert.deepEqual(r.rows[0].total_votes, `1100000.00000000000000000`);
        assert.deepEqual(r.rows[0].is_active, 1);
    })

    it(`unregprod`, () => {
        ctx_sys.unregprodSync("fibos", {
            authorization: "fibos"
        })

        let r = fibos.getTableRowsSync({
            json: true,
            code: "eosio",
            scope: "eosio",
            table: "producers",
            limit: 50
        });
        assert.deepEqual(r.rows[0].total_votes, `1100000.00000000000000000`);
        assert.deepEqual(r.rows[0].is_active, 0);
    })

    it(`voteproducer is baned`, () => {
        assert.throws(() => {
            ctx_sys.voteproducerSync("fibos", "", ["fibos"].sort(), {
                authorization: "fibos"
            })
        });
        let r = fibos.getTableRowsSync({
            json: true,
            code: "eosio",
            scope: "eosio",
            table: "producers",
            limit: 50
        });
        assert.deepEqual(r.rows[0].total_votes, `1100000.00000000000000000`);
        assert.deepEqual(r.rows[0].is_active, 0);
    })
});

require.main === module && test.run(console.DEBUG);