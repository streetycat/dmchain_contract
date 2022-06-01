let test = require('test');
test.setup();

let test_util = require('../test_util');

let checkaccount = test_util.checkaccount;
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let contract = "fibos";
let ctx;

test_util.runBIOS();

function createTestToken(issuer, token_name, connect_token_name, connect_balance_issuer, enter_fee, exit_fee) {
    enter_fee = enter_fee || 0;
    exit_fee = exit_fee || 0;
    let precision = 4;
    let max_supply = fmt(10000000, precision, token_name);
    let max_exchange = fmt(10000000, precision, token_name);
    let reserve_supply = fmt(500000, precision, token_name);
    let reserve_connector_balance = fmt(10000, precision, connect_token_name);
    ctx.excreateSync(issuer, max_supply, 0.2, max_exchange, reserve_supply, reserve_connector_balance, fmtDate(), enter_fee, exit_fee, connect_balance_issuer, {
        authorization: issuer
    });
    ctx.setpositionSync(fmt(10000000, precision, token_name, issuer), 1, "setposition", {
        authorization: issuer
    })
}

describe(`Parameter check fo_fee`, () => {
    let symbol_fo = "FO";
    let symbol_eos = "EOS";
    let name_eos = "eosio";
    let name_fibos = "fibos";
    let precision = 4;
    let name = "user1";
    let symbol_sfa = "SFA";
    let symbol_sfb = "SFB";
    let symbol_sea = "SEA";
    let symbol_seb = "SEB";

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
            authorization: "fibos"
        });
        ctx.excreateSync("eosio", max_supply_fo, 1, max_exchange_fo, reserve_supply_fo, reserve_connector_balance_fo, fmtDate(), 0, 0.03, 'eosio', {
            authorization: "eosio"
        });
        ctx.setpositionSync(fmt(0, 4, symbol_fo, "eosio"), 1, "setposition", {
            authorization: "fibos"
        });
        ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
            authorization: "eosio"
        });
        test_util.exchange(fibos, "fibos", `10000000.0000 EOS@eosio`, `0.0000 FO@eosio`, `exchange EOS to FO`)
        let transfer_amount = "8000.0000";
        ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `transfer FO to ${name}`, {
            authorization: "fibos"
        });
    });

    it(`check FO fee`, () => {
        test_util.checkstat(fibos, name_eos, symbol_fo, name_eos, {
            "supply": "100000.0000 FO",
            "max_supply": "10000000.0000 FO",
            "issuer": "eosio",
            "max_exchange": "10000000.0000 FO",
            "connector_weight": "1.00000000000000000",
            "connector_balance": "10000000.0000 EOS",
            "reserve_supply": "100.0000 FO",
            "reserve_connector_balance": "10000.0000 EOS",
            "connector_balance_issuer": "eosio",
            "buy_fee": "0.00000000000000000",
            "sell_fee": "0.03000000000000000",
            "position": 1
        });
    })

    it(`exchange ${symbol_fo} to ${symbol_eos}`, () => {
        // FO 兑换 EOS 收取出场费
        test_util.exchange(fibos, name, fmt(1, precision, symbol_fo, name_eos), fmt(0, precision, symbol_eos, name_eos), `exchange ${symbol_fo} to ${symbol_eos}`)
        checkaccount(fibos, name, symbol_eos, name_eos, {
            "quantity": fmt(97, precision, symbol_eos),
            "contract": name_eos
        });
        checkaccount(fibos, name, symbol_fo, name_eos, {
            "quantity": fmt(7999, precision, symbol_fo),
            "contract": name_eos
        });
        checkaccount(fibos, name_fibos, symbol_fo, name_eos, {
            "quantity": fmt(92000.03, precision, symbol_fo),
            "contract": name_eos
        });
    });

    it(`exchange ${symbol_eos} to ${symbol_fo}`, () => {
        // FO 兑换 EOS 不收取手续费
        test_util.exchange(fibos, name, fmt(10, precision, symbol_eos, name_eos), fmt(0, precision, symbol_fo, name_eos), `exchange ${symbol_eos} to ${symbol_fo}`)
        checkaccount(fibos, name, symbol_eos, name_eos, {
            "quantity": fmt(87, precision, symbol_eos),
            "contract": name_eos
        });
        checkaccount(fibos, name, symbol_fo, name_eos, {
            "quantity": fmt(7999.1, precision, symbol_fo),
            "contract": name_eos
        });
        checkaccount(fibos, name_fibos, symbol_fo, name_eos, {
            "quantity": fmt(92000.03, precision, symbol_fo),
            "contract": name_eos
        });
    });

    it(`create smart token`, () => {
        createTestToken(name_fibos, symbol_sea, symbol_eos, name_eos, 0, 0.4);
        createTestToken(name_fibos, symbol_seb, symbol_eos, name_eos, 0.5, 0);
    });

    it(`exchange ${symbol_eos} to ${symbol_sea}`, () => {
        test_util.exchange(fibos, name, fmt(10, precision, symbol_eos, name_eos), fmt(0, precision, symbol_sea, name_fibos), `exchange ${symbol_eos} to ${symbol_sea}`)
        checkaccount(fibos, name, symbol_eos, name_eos, {
            "quantity": fmt(77, precision, symbol_eos),
            "contract": name_eos
        });
        checkaccount(fibos, name, symbol_sea, name_fibos, {
            "quantity": fmt(99.96, precision, symbol_sea),
            "contract": name_fibos
        });
        checkaccount(fibos, name_fibos, symbol_sea, name_fibos, {
            "quantity": fmt(0, precision, symbol_sea),
            "contract": name_fibos
        });
    });

    it(`exchange ${symbol_sea} to ${symbol_seb}`, () => {
        //FO 兑换非 EOS 时不收取手续费
        test_util.exchange(fibos, name, fmt(10, precision, symbol_sea, name_fibos), fmt(0, precision, symbol_seb, name_fibos), `exchange ${symbol_sea} to ${symbol_seb}`)
        checkaccount(fibos, name, symbol_sea, name_fibos, {
            "quantity": fmt(89.96, precision, symbol_sea),
            "contract": name_fibos
        });
        checkaccount(fibos, name, symbol_seb, name_fibos, {
            "quantity": fmt(3.0019, precision, symbol_seb),
            "contract": name_fibos
        });
        checkaccount(fibos, name_fibos, symbol_sea, name_fibos, {
            "quantity": fmt(4, precision, symbol_sea),
            "contract": name_fibos
        });

        checkaccount(fibos, name_fibos, symbol_seb, name_fibos, {
            "quantity": fmt(3.0019, precision, symbol_seb),
            "contract": name_fibos
        });
    });
});
require.main === module && test.run(console.DEBUG);
