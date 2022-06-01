let test = require('test');
test.setup();

let test_util = require('../test_util');
let fibos = test_util.getFIBOS();
let fmt = test_util.fmt;
let fmtDate = test_util.fmtDate;
let checkaccount = test_util.checkaccount
let ctx;
test_util.runBIOS();

let precision = 4;
function createTestToken(issuer, token_name, connect_token_name, connect_balance_issuer, enter_fee, exit_fee) {
    enter_fee = enter_fee || 0;
    exit_fee = exit_fee || 0;
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

function TestExchange() {
    test_util.runBIOS();
    describe(`Parameter check exchange`, () => {
        let name = "user1";
        let name2 = "user2";
        let name_eos = "eosio";
        let symbol_sfa = "SMTA";
        let symbol_sfb = "SMTB";
        let symbol_sea = "SMTC";
        let symbol_seb = "SMTD";
        let symbol_scaa = "SMTE";
        let symbol_scab = "SMTF";
        let symbol_scba = "SMTG";
        let symbol_scbb = "SMTH";

        let symbol_fo = "FO";
        let symbol_eos = "EOS";
        let symbol_cta = "CTA";
        let symbol_ctb = "CTB";
        let symbol_si = "SMTI";
        before(() => {
            name = "user1";
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
            }
            ctx = fibos.contractSync("eosio.token");
            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            let r = ctx.excreateSync("eosio", `10000000.0000 FO`, 0, `10000000.0000 FO`, `100.0000 FO`, `10000.0000 EOS`, fmtDate(), 0, 0, "eosio", {
                authorization: "eosio"
            });
            assert.equal(r.processed.action_traces[0].console, "");
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `1000000.0000 FO`, `issue 100.0000 FO`, {
                authorization: "eosio"
            });
            let transfer_amount = "8000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `transfer FO to ${name}`, {
                authorization: "fibos"
            });
            ctx.extransferSync("fibos", name, `${transfer_amount} EOS@eosio`, `transfer EOS to ${name}`, {
                authorization: "fibos"
            })
            assert.equal(r.processed.action_traces[0].console, "");
        });

        it(`create classic token`, () => {
            ctx.excreateSync(name, fmt(10000000, precision, symbol_cta), 0, fmt(10000000, precision, symbol_cta), fmt(500000, precision, symbol_cta), fmt(10000, precision, symbol_eos), fmtDate(), 0, 0, name, {
                authorization: name
            });
            ctx.setpositionSync(fmt(10000000, precision, symbol_cta, name), 1, "setposition", {
                authorization: name
            });
            ctx.excreateSync(name, fmt(10000000, precision, symbol_ctb), 0, fmt(10000000, precision, symbol_ctb), fmt(500000, precision, symbol_ctb), fmt(10000, precision, symbol_eos), fmtDate(), 0, 0, name, {
                authorization: name
            });
            ctx.setpositionSync(fmt(10000000, precision, symbol_ctb, name), 1, "setposition", {
                authorization: name
            });
        });

        it(`create smart token`, () => {
            createTestToken(name, symbol_sfa, symbol_fo, name_eos);
            createTestToken(name, symbol_sfb, symbol_fo, name_eos);

            createTestToken(name, symbol_sea, symbol_eos, name_eos);
            createTestToken(name, symbol_seb, symbol_eos, name_eos);

            createTestToken(name, symbol_scaa, symbol_cta, name);
            createTestToken(name, symbol_scab, symbol_cta, name);

            createTestToken(name, symbol_scba, symbol_ctb, name);
            createTestToken(name, symbol_scbb, symbol_ctb, name);
        });

        it(`0.exchange ${symbol_eos} to ${symbol_seb}`, () => {
            ctx.exchangeSync(name, fmt(1, precision, symbol_eos, name_eos), fmt(0, precision, symbol_seb, name), 0, "id", `exchange ${symbol_eos} to ${symbol_seb}`, {
                authorization: name
            });
            checkaccount(fibos, name, symbol_seb, name, {
                "quantity": `9.9996 ${symbol_seb}`,
                "contract": name
            });
        });

        it(`1.can't exchange ${symbol_fo} to ${symbol_seb}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_fo, name_eos), fmt(0, precision, symbol_seb, name), 0, "id", `exchange ${symbol_fo} to ${symbol_seb}`, {
                    authorization: name
                });
            });
        });

        it(`2.can't exchange ${symbol_seb} to ${symbol_sfa}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_seb, name), fmt(0, precision, symbol_sfa, name), 0, "id", `exchange ${symbol_seb} to ${symbol_sfa}`, {
                    authorization: name
                });
            });
        });

        it(`3.exchange ${symbol_fo} to ${symbol_sfa}`, () => {
            ctx.exchangeSync(name, fmt(1, precision, symbol_fo, name_eos), fmt(0, precision, symbol_sfa, name), 0, "id", `exchange ${symbol_fo} to ${symbol_sfa}`, {
                authorization: name
            });
            checkaccount(fibos, name, symbol_sfa, name, {
                "quantity": `9.9996 ${symbol_sfa}`,
                "contract": name
            });
        });

        it(`4.can't  exchange ${symbol_eos} to ${symbol_sfa}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_eos, name_eos), fmt(0, precision, symbol_sfa, name), 0, "id", `exchange ${symbol_eos} to ${symbol_sfa}`, {
                    authorization: name
                });
            });
        });

        it(`5.can't  exchange ${symbol_seb} to ${symbol_sea}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(2, precision, symbol_seb, name), fmt(0, precision, symbol_sea, name), 0, "id", `exchange ${symbol_seb} to ${symbol_sea}`, {
                    authorization: name
                });
            });
        });

        it(`6.can't  exchange ${symbol_sfa} to ${symbol_sfb}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_sfa, name), fmt(0, precision, symbol_sfb, name), 0, "id", `exchange ${symbol_sfa} to ${symbol_sfb}`, {
                    authorization: name
                });
            });
        });

        it(`7.exchange ${symbol_cta} to ${symbol_scaa}`, () => {
            ctx.exissueSync(name, fmt(1000, precision, symbol_cta, name), `issue 1000.0000 ${symbol_cta}`, {
                authorization: name
            });
            ctx.exchangeSync(name, fmt(1, precision, symbol_cta, name), fmt(0, precision, symbol_scaa, name), 0, "id", `exchange ${symbol_cta} to ${symbol_scaa}`, {
                authorization: name
            });
            checkaccount(fibos, name, symbol_scaa, name, {
                "quantity": `9.9996 ${symbol_scaa}`,
                "contract": name
            });
        });

        it(`8.can't  exchange ${symbol_scaa} to ${symbol_scab}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_scaa, name), fmt(0, precision, symbol_scab, name), 0, "id", `exchange ${symbol_scaa} to ${symbol_scab}`, {
                    authorization: name
                });
            });
        });

        it(`9.exchange ${symbol_seb} to ${symbol_eos}`, () => {
            checkaccount(fibos, name, symbol_eos, name_eos, {
                "quantity": `7999.0000 ${symbol_eos}`,
                "contract": name_eos
            });
            ctx.exchangeSync(name, fmt(1, precision, symbol_seb, name), fmt(0, precision, symbol_eos, name_eos), 0, "id", `exchange ${symbol_seb} to ${symbol_eos}`, {
                authorization: name
            });
            checkaccount(fibos, name, symbol_eos, name_eos, {
                "quantity": `7999.1000 ${symbol_eos}`,
                "contract": name_eos
            });
        });

        it(`10.cab't exchange ${symbol_seb} to ${symbol_fo}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_seb, name), fmt(0, precision, symbol_fo, name_eos), 0, "id", `exchange ${symbol_seb} to ${symbol_fo}`, {
                    authorization: name
                });
            });
        });

        it(`11.can't exchange ${symbol_sfa} to ${symbol_seb}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_sfa, name), fmt(0, precision, symbol_seb, name), 0, "id", `exchange ${symbol_sfa} to ${symbol_seb}`, {
                    authorization: name
                });
            });
        });

        it(`12.exchange ${symbol_sfa} to ${symbol_fo}`, () => {
            ctx.exchangeSync(name, fmt(1, precision, symbol_sfa, name), fmt(0, precision, symbol_fo, name_eos), 0, "id", `exchange ${symbol_sfa} to ${symbol_fo}`, {
                authorization: name
            });
        });

        it(`13.can't exchange ${symbol_sfa} to ${symbol_eos}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_sfa, name), fmt(0, precision, symbol_eos, name_eos), 0, "id", `exchange ${symbol_sfa} to ${symbol_eos}`, {
                    authorization: name
                });
            });
        });

        it(`14.can't exchange ${symbol_sea} to ${symbol_seb}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_sea, name), fmt(0, precision, symbol_seb, name), 0, "id", `exchange ${symbol_sea} to ${symbol_seb}`, {
                    authorization: name
                });
            });
        });

        it(`15.can't exchange ${symbol_sfb} to ${symbol_sfa}`, () => {
            ctx.exchangeSync(name, fmt(10, precision, symbol_fo, name_eos), fmt(0, precision, symbol_sfb, name), 0, "id", `exchange ${symbol_fo} to ${symbol_sfb}`, {
                authorization: name
            });
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_sfb, name), fmt(0, precision, symbol_sfa, name), 0, "id", `exchange ${symbol_sfb} to ${symbol_sfa}`, {
                    authorization: name
                });
            });
        });

        it(`16.exchange ${symbol_scaa} to ${symbol_cta}`, () => {
            ctx.exchangeSync(name, fmt(1, precision, symbol_scaa, name), fmt(0, precision, symbol_cta, name), 0, "id", `exchange ${symbol_scaa} to ${symbol_cta}`, {
                authorization: name
            });
        });

        it(`17.exchange ${symbol_scab} to ${symbol_scaa}`, () => {
            ctx.exchangeSync(name, fmt(10, precision, symbol_cta, name), fmt(0, precision, symbol_scab, name), 0, "id", `exchange ${symbol_cta} to ${symbol_scab}`, {
                authorization: name
            });
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_scab, name), fmt(0, precision, symbol_scaa, name), 0, "id", `exchange ${symbol_scab} to ${symbol_scaa}`, {
                    authorization: name
                });
            });
        });

        it(`18.create smart token SMTI ,connect token is smart token`, () => {
            createTestToken(name, symbol_si, symbol_sfa, name);
        });

        it(`19.can't exchange ${symbol_sfa} to ${symbol_scba}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_sfa, name), fmt(0, precision, symbol_scba, name), 0, "id", `exchange ${symbol_sfa} to ${symbol_scba}`, {
                    authorization: name
                });
            });
        });

        it(`20.can't exchange ${symbol_scaa} to ${symbol_fo}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_scaa, name), fmt(0, precision, symbol_fo, name_eos), 0, "id", `exchange ${symbol_scaa} to ${symbol_fo}`, {
                    authorization: name
                });
            });
        });

        it(`21.can't exchange ${symbol_scaa} to ${symbol_eos}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_scaa, name), fmt(0, precision, symbol_eos, name_eos), 0, "id", `exchange ${symbol_scaa} to ${symbol_eos}`, {
                    authorization: name
                });
            });
        });

        it(`22.can't exchange ${symbol_scaa} to ${symbol_seb}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_scaa, name), fmt(0, precision, symbol_seb, name), 0, "id", `exchange ${symbol_scaa} to ${symbol_seb}`, {
                    authorization: name
                });
            });
        });

        it(`23.can't exchange ${symbol_eos} to ${symbol_cta}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_eos, name_eos), fmt(0, precision, symbol_cta, name), 0, "id", `exchange ${symbol_eos} to ${symbol_cta}`, {
                    authorization: name
                });
            });
        });

        it(`24.can't exchange ${symbol_fo} to ${symbol_cta}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_fo, name_eos), fmt(0, precision, symbol_cta, name), 0, "id", `exchange ${symbol_fo} to ${symbol_cta}`, {
                    authorization: name
                });
            });
        });


        it(`25.can't exchange ${symbol_seb} to ${symbol_cta}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_seb, name), fmt(0, precision, symbol_cta, name), 0, "id", `exchange ${symbol_seb} to ${symbol_cta}`, {
                    authorization: name
                });
            });
        });

        it(`26.can't exchange ${symbol_sfa} to ${symbol_cta}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_sfa, name), fmt(0, precision, symbol_cta, name), 0, "id", `exchange ${symbol_sfa} to ${symbol_cta}`, {
                    authorization: name
                });
            });
        });

        it(`27.can't exchange ${symbol_cta} to ${symbol_ctb}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_cta, name), fmt(0, precision, symbol_ctb, name), 0, "id", `exchange ${symbol_cta} to ${symbol_ctb}`, {
                    authorization: name
                });
            });
        });

        it(`28.can't exchange ${symbol_cta} to ${symbol_scba}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_cta, name), fmt(0, precision, symbol_scba, name), 0, "id", `exchange ${symbol_cta} to ${symbol_scba}`, {
                    authorization: name
                });
            });
        });

        it(`29.can't exchange ${symbol_scba} to ${symbol_sfa}`, () => {
            ctx.exissueSync(name, fmt(1000, precision, symbol_ctb, name), `issue 1000.0000 ${symbol_ctb}`, {
                authorization: name
            });
            ctx.exchangeSync(name, fmt(10, precision, symbol_ctb, name), fmt(0, precision, symbol_scba, name), 0, "id", `exchange ${symbol_ctb} to ${symbol_scba}`, {
                authorization: name
            });
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_scba, name), fmt(0, precision, symbol_sfa, name), 0, "id", `exchange ${symbol_scba} to ${symbol_sfa}`, {
                    authorization: name
                });
            });
        });

        it(`30.can't exchange ${symbol_fo} to ${symbol_scaa}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_fo, name_eos), fmt(0, precision, symbol_scaa, name), 0, "id", `exchange ${symbol_fo} to ${symbol_scaa}`, {
                    authorization: name
                });
            });
        });

        it(`31.can't exchange ${symbol_eos} to ${symbol_scaa}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_eos, name_eos), fmt(0, precision, symbol_scaa, name), 0, "id", `exchange ${symbol_eos} to ${symbol_scaa}`, {
                    authorization: name
                });
            });
        });

        it(`32.can't exchange ${symbol_seb} to ${symbol_scaa}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_seb, name), fmt(0, precision, symbol_scaa, name), 0, "id", `exchange ${symbol_seb} to ${symbol_scaa}`, {
                    authorization: name
                });
            });
        });

        it(`33.can't exchange ${symbol_cta} to ${symbol_eos}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_cta, name), fmt(0, precision, symbol_eos, name_eos), 0, "id", `exchange ${symbol_cta} to ${symbol_eos}`, {
                    authorization: name
                });
            });
        });

        it(`34.can't exchange ${symbol_cta} to ${symbol_fo}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_cta, name), fmt(0, precision, symbol_fo, name_eos), 0, "id", `exchange ${symbol_cta} to ${symbol_fo}`, {
                    authorization: name
                });
            });
        });

        it(`35.can't exchange ${symbol_cta} to ${symbol_seb}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_cta, name), fmt(0, precision, symbol_seb, name), 0, "id", `exchange ${symbol_cta} to ${symbol_seb}`, {
                    authorization: name
                });
            });
        });

        it(`36.can't exchange ${symbol_cta} to ${symbol_sfa}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_cta, name), fmt(0, precision, symbol_sfa, name), 0, "id", `exchange ${symbol_cta} to ${symbol_sfa}`, {
                    authorization: name
                });
            });
        });

        it(`37.can't exchange ${symbol_ctb} to ${symbol_cta}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_ctb, name), fmt(0, precision, symbol_cta, name), 0, "id", `exchange ${symbol_ctb} to ${symbol_cta}`, {
                    authorization: name
                });
            });
        });

        it(`38.can't exchange ${symbol_scba} to ${symbol_cta}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name, fmt(1, precision, symbol_scba, name), fmt(0, precision, symbol_cta, name), 0, "id", `exchange ${symbol_scba} to ${symbol_cta}`, {
                    authorization: name
                });
            });
        });

        it(`39.exchange ${symbol_sfa} to ${symbol_si}`, () => {
            ctx.exchangeSync(name, fmt(1, precision, symbol_sfa, name), fmt(0, precision, symbol_si, name), 0, "id", `exchange ${symbol_sfa} to ${symbol_si}`, {
                authorization: name
            });
        })

        it(`40.exchange ${symbol_si} to ${symbol_sfa}`, () => {
            ctx.exchangeSync(name, fmt(1, precision, symbol_si, name), fmt(0, precision, symbol_sfa, name), 0, "id", `exchange ${symbol_si} to ${symbol_sfa}`, {
                authorization: name
            });
        })
    });
}

function TestFeeExchange() {
    test_util.runBIOS();
    describe(`Parameter check exchange`, () => {
        let name = "user1";
        let name2 = "user2";
        let name_eos = "eosio";

        let symbol_sfc = "SMTNA";
        let symbol_sfd = "SMTNB";
        let symbol_sec = "SMTNC";
        let symbol_sed = "SMTND";

        let symbol_fo = "FO";
        let symbol_eos = "EOS";

        before(() => {
            name = "user1";
            if (name !== 'eosio' && name !== 'fibos') {
                test_util.user(fibos, name);
            }
            ctx = fibos.contractSync("eosio.token");
            ctx.createSync("eosio", "50000000.0000 EOS", {
                authorization: "eosio"
            });
            ctx.setpositionSync(fmt(1000000000, 4, "EOS", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            let r = ctx.excreateSync("eosio", `10000000.0000 FO`, 0, `10000000.0000 FO`, `100.0000 FO`, `10000.0000 EOS`, fmtDate(), 0, 0, "eosio", {
                authorization: "eosio"
            });
            assert.equal(r.processed.action_traces[0].console, "");
            ctx.setpositionSync(fmt(1000000000, 4, "FO", "eosio"), 1, "setposition", {
                authorization: "fibos"
            });
            ctx.issueSync("fibos", `10000000.0000 EOS`, `issue 100.0000 EOS`, {
                authorization: "eosio"
            });
            ctx.issueSync("fibos", `1000000.0000 FO`, `issue 10000000.0000 FO`, {
                authorization: "eosio"
            })
            let transfer_amount = "8000.0000";
            ctx.extransferSync("fibos", name, `${transfer_amount} FO@eosio`, `transfer FO to ${name}`, {
                authorization: "fibos"
            });
            test_util.user(fibos, name2);
            ctx.extransferSync("fibos", name2, `${transfer_amount} FO@eosio`, `transfer FO to ${name2}`, {
                authorization: "fibos"
            });
            ctx.extransferSync("fibos", name2, `${transfer_amount} EOS@eosio`, `transfer FO to ${name2}`, {
                authorization: "fibos"
            });
            assert.equal(r.processed.action_traces[0].console, "");
        });

        it(`0.create smart token`, () => {
            createTestToken(name, symbol_sfc, symbol_fo, name_eos, 0.2, 0.4);
            createTestToken(name, symbol_sfd, symbol_fo, name_eos, 0.4, 0.2);

            createTestToken(name, symbol_sec, symbol_eos, name_eos, 0.1, 0.3);
            createTestToken(name, symbol_sed, symbol_eos, name_eos, 0.3, 0.1);
        });

        it(`1.exchange ${symbol_eos} to ${symbol_sec}`, () => {
            ctx.exchangeSync(name2, fmt(10, precision, symbol_eos, name_eos), fmt(0, precision, symbol_sec, name), 0, "id", `exchange ${symbol_eos} to ${symbol_sec}`, {
                authorization: name2
            });
            checkaccount(fibos, name, symbol_sec, name, {
                "quantity": `9.9960 ${symbol_sec}`,
                "contract": name
            });
            checkaccount(fibos, name2, symbol_sec, name, {
                "quantity": `89.9640 ${symbol_sec}`,
                "contract": name
            });
        });

        it(`2.exchange ${symbol_sec} to ${symbol_sfc}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name2, fmt(10, precision, symbol_sec, name), fmt(0, precision, symbol_sfc, name), 0, "id", `exchange ${symbol_sec} to ${symbol_sfc}`, {
                    authorization: name2
                })
            });
        });

        it(`3.exchange ${symbol_sfc} to ${symbol_sed}`, () => {
            assert.throws(() => {
                ctx.exchangeSync(name2, fmt(0.05, precision, symbol_sfc, name), fmt(0, precision, symbol_sed, name), 0, "id", `exchange ${symbol_sfc} to ${symbol_sed}`, {
                    authorization: name2
                });
            });
        });
    });
}
TestExchange();
TestFeeExchange();

require.main === module && test.run(console.DEBUG);