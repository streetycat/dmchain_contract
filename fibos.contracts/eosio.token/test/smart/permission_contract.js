let test = require('test');
test.setup();

let test_util = require('../test_util');

let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;

test_util.runBIOS();

describe('Permission Contract', () => {
    var a, b, ctx;

    before(() => {
        a = test_util.user(fibos);
        b = test_util.user(fibos);

        ctx = fibos.contractSync("eosio.token");
        ctx.createSync("eosio", "10000000000.0000 EOS", {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.issueSync("eosio", `100000000.0000 EOS`, `issue 100000000.0000 EOS`, {
            authorization: "eosio"
        });
        ctx.excreateSync("eosio", "100000000000.0000 FO", 0, '10000000000.0000 FO', '3000000000.0000 FO', '90000.0000 EOS', 0, 0, 0, 'eosio', {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.excreateSync(a, "1000.0000 ABC", 0, '100.0000 ABC', '0.0000 ABC', '0.0000 FO', fmtDate(), 0, 0, 'eosio', {
            authorization: a
        });
        ctx.setpositionSync(fmt(1000000000, 4, "ABC", a), 1, "setposition", {
            authorization: a
        });
        ctx.exissueSync(b, `500.0000 ABC@${a}`, `issue 500.0000 ABC@${a}`, {
            authorization: a
        });
        ctx.ctxrechargeSync(b, `300.0000 ABC@${a}`, `ctxrecharge 300.0000 ABC`, {
            authorization: b
        });
    });

    it('check send_inline permission', () => {
        var FIBOS = require('fibos.js');
        var fibos = FIBOS(test_util.config);
        var abi = {
            "version": "eosio::abi/1.0",
            "structs": [{
                "name": "hi",
                "base": "",
                "fields": [{
                    "name": "from",
                    "type": "name"
                }, {
                    "name": "to",
                    "type": "name"
                }, {
                    "name": "quantity",
                    "type": "extended_asset"
                }, {
                    "name": "memo",
                    "type": "string"
                }]
            }],
            "actions": [{
                "name": "hi",
                "type": "hi",
                "ricardian_contract": ""
            }]
        };

        fibos.setabiSync(a, abi, {
            authorization: a
        });

        var js_code = `exports.hi = (from, to, quantity, memo) => {
            console.log(from, to, quantity, memo);

            trans.send_inline("eosio.token", "ctxtransfer", {
                from: from,
                to: to,
                quantity: quantity,
                memo: memo
            }, [{
                "actor": "${b}",
                "permission": "active"
            }]);
        };`;

        fibos.setcodeSync(a, 0, 0, fibos.compileCode(js_code), {
            authorization: a
        });

        fibos.updateauthSync({
            account: a,
            permission: "active",
            parent: 'owner',
            auth: {
                threshold: 1,
                keys: [{
                    key: "FO6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                    weight: 1
                }],
                "accounts": [{
                    "permission": {
                        "actor": a,
                        "permission": "eosio.code"
                    },
                    "weight": 1
                }]
            }
        }, {
                authorization: a
            });

        var ctx2 = fibos.contractSync(a);

        assert.throws(() => {
            ctx2.hiSync(b, a, `100.0000 ABC@${a}`, 'test ctxtransfer', {
                authorization: b
            });
        });

        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", a, "accounts"), {
            "rows": [{
                "primary": 0,
                "balance": {
                    "quantity": "0.0000 ABC",
                    "contract": a
                }
            }],
            "more": false
        });

        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", a, "ctxaccounts"), {
            "rows": [],
            "more": false
        });

        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", b, "accounts"), {
            "rows": [{
                "primary": 0,
                "balance": {
                    "quantity": "200.0000 ABC",
                    "contract": a
                }
            }],
            "more": false
        });

        assert.deepEqual(fibos.getTableRowsSync(true, "eosio.token", b, "ctxaccounts"), {
            "rows": [{
                "primary": 0,
                "balance": {
                    "quantity": "300.0000 ABC",
                    "contract": a
                }
            }],
            "more": false
        });
    });
});

require.main === module && test.run(console.DEBUG);