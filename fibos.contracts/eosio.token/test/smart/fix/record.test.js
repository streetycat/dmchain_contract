const test = require('test');
const coroutine = require('coroutine');

test.setup();

let test_util = require('../../test_util');

test_util.runBIOS();
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;

describe(`record actions`, () => {
    let ctx, name, name1;

    before(() => {
        name = 'user1';
        test_util.user(fibos, name);
        name1 = test_util.user(fibos, name1);
        ctx = fibos.contractSync("eosio.token");

        ctx.createSync("eosio", "50000000.0000 EOS", {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.excreateSync("eosio", `100000000000.0000 FO`, 0, `10000000000.0000 FO`, `5000000000.0000 FO`, `550000.0000 EOS`, 0, 0, 0, 'eosio', {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
            authorization: "fibos"
        });

        ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
            authorization: "eosio"
        });
        ctx.issueSync("fibos", `1000000000.0000 FO`, `issue 100.0000 FO`, {
            authorization: "eosio"
        });
        ctx.issueSync('fibos', `1408102.0000 FO@eosio`, '0.0000 EOS@eosio', {
            authorization: 'eosio'
        });
    });

    it('exchange A to B should have 2 receipts and 2 snapshots, but cant', () => {
        ctx.excreateSync("user1", `100000000000.0000 A`, 0.11, `10000000000.0000 A`, `5000000000.0000 A`, `550000.0000 FO`, fmtDate(), 0, 0, 'eosio', {
            authorization: "user1"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "A", "user1"), 1, "setposition", {
            authorization: "user1"
        });
        ctx.excreateSync("user1", `100000000000.0000 B`, 0.11, `10000000000.0000 B`, `5000000000.0000 B`, `550000.0000 FO`, fmtDate(), 0, 0, 'eosio', {
            authorization: "user1"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "B", "user1"), 1, "setposition", {
            authorization: "user1"
        });
        ctx.transferSync("fibos", "user1", `1.0000 FO@eosio`, `transfer`, {
            authorization: "fibos"
        });
        test_util.exchange(fibos, "user1", `0.5000 FO@eosio`, `0.0000 A@user1`, ``)
        assert.throws(() => {
            test_util.exchange(fibos, "user1", '1.0000 A@user1', '0.0000 B@user1', 'exchange')
        });
    });

    it('issue should have 1 snapshot', () => {
        let r = ctx.issueSync('fibos', `1.0000 FO@eosio`, '0.0000 EOS@eosio', {
            authorization: 'eosio'
        });
        assert.equal("snapshot", r.processed.action_traces[0].inline_traces[1].act.name);
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "contract": "eosio",
            "max_supply": "100000000000.0000 FO",
            "cw": "0.00000000000000000",
            "max_exchange": "0.0000 FO",
            "supply": "1001408103.0000 FO",
            "reserve_supply": "5000000000.0000 FO",
            "connector_balance": "0.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio"
        });
    });

    it('retire should have 1 snapshot', () => {
        let r = ctx.exretireSync('fibos', `1.0000 FO@eosio`, "retire", {
            authorization: 'fibos'
        });
        assert.equal("snapshot", r.processed.action_traces[0].inline_traces[0].act.name);
        assert.deepEqual(r.processed.action_traces[0].inline_traces[0].act.data, {
            "contract": "eosio",
            "max_supply": "100000000000.0000 FO",
            "cw": "0.00000000000000000",
            "max_exchange": "0.0000 FO",
            "supply": "1001408102.0000 FO",
            "reserve_supply": "5000000000.0000 FO",
            "connector_balance": "0.0000 FO",
            "reserve_connector_balance": "0.0000 FO",
            "connector_balance_issuer": "eosio"
        });
    });

    it("record can only be called by contract itself", () => {
        assert.throws(() => {
            ctx.receiptSync("0.0001 FO@eosio", "0.0001 EOS@eosio", {
                authorization: "user1"
            });
        });
        assert.throws(() => {
            ctx.snapshotSync("user1", "100000000000.0000 FO", "0.1", "10001408102.0000 FO", "508489134.6907 FO", "5001401909.7221 FO", "776613.9194 EOS", "549999.9990 EOS", {
                authorization: "user1"
            });
        });
    })

    it(`FO to C with fee`, () => {
        ctx.excreateSync("user1", `100000000000.0000 C`, 0.11, `10000000000.0000 C`, `5000000000.0000 C`, `550000.0000 FO`, fmtDate(), 0.1, 0.1, 'eosio', {
            authorization: "user1"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "C", "user1"), 1, "setposition", {
            authorization: "user1"
        });
        let r = test_util.exchange(fibos, "user1", `0.5000 FO@eosio`, `0.0000 C@user1`, ``)
        assert.equal("receipt", r.processed.action_traces[0].inline_traces[1].act.name);
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "in": {
                "quantity": "0.5000 FO",
                "contract": "eosio"
            },
            "out": {
                "quantity": "449.9998 C",
                "contract": "user1"
            },
            "fee": {
                "quantity": "49.9999 C",
                "contract": "user1"
            }
        });
    });

    it(`exchange C to D with fee, but cant`, () => {
        ctx.transferSync("fibos", "user1", `2.0000 FO@eosio`, `transfer`, {
            authorization: "fibos"
        });
        ctx.excreateSync("user1", `100000000000.0000 D`, 0.11, `10000000000.0000 D`, `5000000000.0000 D`, `550000.0000 FO`, fmtDate(), 0.1, 0.1, 'eosio', {
            authorization: "user1"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "D", "user1"), 1, "setposition", {
            authorization: "user1"
        });
        test_util.exchange(fibos, "user1", `0.5000 FO@eosio`, `0.0000 D@user1`, ``)
        assert.throws(() => {
            test_util.exchange(fibos, "user1", `0.5000 C@user1`, `0.0000 D@user1`, ``)
        });
    })

    it(`D to FO, feereceipt of sell_fee(type is 1)`, () => {
        let r = test_util.exchange(fibos, "user1", `1.2000 D@user1`, `0.0000 FO@eosio`, ``)
        assert.equal("receipt", r.processed.action_traces[0].inline_traces[1].act.name);
        assert.deepEqual(r.processed.action_traces[0].inline_traces[1].act.data, {
            "in": {
                "quantity": "1.0800 D",
                "contract": "user1"
            },
            "out": {
                "quantity": "0.0010 FO",
                "contract": "eosio"
            },
            "fee": {
                "quantity": "0.1200 D",
                "contract": "user1"
            }
        });
    })

});

require.main === module && test.run(console.DEBUG);