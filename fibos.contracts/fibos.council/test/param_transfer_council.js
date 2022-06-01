let test = require('test');
test.setup();

let test_util = require('./test_util');

let checkaccount = test_util.checkaccount;
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let contract = "fibos";

test_util.runBIOS();

describe(`Parameter check extransfer council args`, () => {
    let symbol_fo = "FO";
    let symbol_eos = "EOS";
    let name_eos = "eosio";
    let name = "user1";
    let precision = 4;
    let ctx;

    let max_supply_fo = fmt(10000000, precision, symbol_fo);
    let max_exchange_fo = fmt(10000000, precision, symbol_fo);
    let reserve_supply_fo = fmt(100, precision, symbol_fo);
    let reserve_connector_balance_fo = fmt(10000, precision, symbol_eos);

    before(() => {
        fund = 'fibos';
        if (name !== 'eosio' && name !== 'fibos') {
            test_util.user(fibos, name);
            fund = contract;
        }
        ctx = fibos.contractSync("eosio.token");
        ctx.createSync("eosio", "50000000.0000 EOS", {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
            authorization: "eosio"
        });
        ctx.excreateSync("eosio", max_supply_fo, 1, max_exchange_fo, reserve_supply_fo, reserve_connector_balance_fo, fmtDate(), 0, 0, 'eosio', {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(0, 4, symbol_fo, "eosio"), 1, "setposition", {
            authorization: "eosio"
        });
        ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
            authorization: "eosio"
        });
        ctx.exchangeSync("fibos", `10000000.0000 EOS@eosio`, `0.0000 FO@eosio`, `exchange EOS to FO`, {
            authorization: "fibos"
        });
        let transfer_amount = "8000.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `transfer FO to ${name}`, {
            authorization: "fibos"
        });
        ctx.exchangeSync(name, fmt(4000, precision, symbol_fo, name_eos), fmt(0, precision, symbol_eos, name_eos), `exchange ${symbol_fo} to ${symbol_eos}`, {
            authorization: name
        });
    });

    it(`invalid symbol`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fiboscouncil", fmt(10, precision, symbol_fo), `name`, {
                authorization: name
            });
        });
    });

    it(`empty memo`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fiboscouncil", fmt(10, precision, symbol_eos), "", {
                authorization: name
            });
        });
    });

    it(`memo >12 characters`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fiboscouncil", fmt(10, precision, symbol_eos), "abcdefghijklm", {
                authorization: name
            });
        });
    });

    it(`invalid memo characters`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fiboscouncil", fmt(10, precision, symbol_eos), "a6", {
                authorization: name
            });
        });
    });

    it(`invalid period begin pos`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fiboscouncil", fmt(10, precision, symbol_eos), ".a", {
                authorization: name
            });
        });
    });

    it(`invalid period end pos`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fiboscouncil", fmt(10, precision, symbol_eos), "a.", {
                authorization: name
            });
        });
    });

    it(`memo is council account`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fiboscouncil", fmt(10, precision, symbol_eos), "fiboscouncil", {
                authorization: name
            });
        });
    });

    it(`memo is council account with memo`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fiboscouncil", fmt(10, precision, symbol_eos), "fiboscouncil,中文", {
                authorization: name
            });
        });
    });

    it(`double period`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fiboscouncil", fmt(10, precision, symbol_eos), ".a.", {
                authorization: name
            });
        });
    });

    it(`invalid memo format`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fiboscouncil", fmt(1, precision, symbol_eos), "  ,memo", {
                authorization: name
            });
        });
    });

    it(`invalid transfer with blank`, () => {
        assert.throws(() => {
            ctx.transferSync(name, "fiboscouncil", fmt(1, precision, symbol_eos), " a ,memo", {
                authorization: name
            });
        });
    });

    it(`normal transfer `, () => {
        ctx.transferSync(name, "fiboscouncil", fmt(1, precision, symbol_eos), "a", {
            authorization: name
        });
    });

    it(`normal transfer2 `, () => {
        ctx.transferSync(name, "fiboscouncil", fmt(1, precision, symbol_eos), "a.a", {
            authorization: name
        });
    });

    it(`normal transfer3 `, () => {
        ctx.transferSync(name, "fiboscouncil", fmt(1, precision, symbol_eos), "a,信息", {
            authorization: name
        });
    });

});
require.main === module && test.run(console.DEBUG);
