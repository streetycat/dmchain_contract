let test = require('test');
test.setup();

let test_util = require('../test_util');
let fmt = test_util.fmt;

test_util.runBIOS();

describe(`nft test`, () => {
    let fibos, contract, name, name2, ctx;

    before(() => {
        fibos = test_util.getFIBOS();
        contract = test_util.user(fibos)
        name = test_util.user(fibos);
        name2 = test_util.user(fibos);
        test_util.deployCont(fibos, contract, 'eosio.token', contract, "../bin/");
        ctx = fibos.contractSync(contract);
    });

    describe(`nftcreatesym`, () => {
        it('must use valid type', () => {
            assert.throws(() => {
                ctx.nftcreatesymSync(fmt(100, 0, "AAA", name), "", 3, {
                    authorization: name
                });
            });
        });

        it('invalid precision', () => {
            assert.throws(() => {
                ctx.nftcreatesymSync(fmt(0, 1, "AAA", name), "", 1, {
                    authorization: name
                });
            });
        });

        it('normal create symbol AAA', () => {
            ctx.nftcreatesymSync({
                nft_symbol: fmt(1, 0, "AAA", name),
                symbol_uri: "http://721.com",
                type: 1,
            }, {
                authorization: name
            });
        });
        it('symbol already exists', () => {
            assert.throws(() => {
                ctx.nftcreatesymSync(fmt(1, 0, "AAA", name), "", 1, {
                    authorization: name
                });
            });
        });
        it('normal create symbol BBB', () => {
            ctx.nftcreatesymSync({
                nft_symbol: fmt(1, 0, "BBB", name),
                symbol_uri: "http://1155.com",
                type: 2,
            }, {
                authorization: name
            });
        });
    });
    describe(`queryall`, () => {
        it('nftsymbols', () => {
            let result = fibos.getTableRowsSync({
                code: contract,
                scope: contract,
                table: "nftsymbols",
                json: true,
            });
            console.log(result);
        });
    });

    describe(`nftcreate`, () => {
        it('normal create nftAAA', () => {
            ctx.nftcreateSync(name2, "", "nft_nameAAA", "extra_dataAAA", fmt(1, 0, "AAA", name), {
                authorization: name
            });
        });
        it('normal create nftBBB', () => {
            ctx.nftcreateSync(name2, "", "nft_nameBBB", "extra_dataBBB", fmt(100, 0, "BBB", name), {
                authorization: name
            });
        });
        it('symbol not exists', () => {
            assert.throws(() => {
                ctx.nftcreateSync(name2, "", "nft_nameCCC", "extra_dataCCC", fmt(1, 0, "CCC", name), {
                    authorization: name
                });
            });
        });
        it('721 can only issue 1', () => {
            assert.throws(() => {
                ctx.nftcreateSync(name2, "", "nft_nameAAA", "extra_dataAAA", fmt(2, 0, "AAA", name), {
                    authorization: name
                });
            });
        });
    });


    describe(`nftissue`, () => {
        it('normal issue nftBBB', () => {
            ctx.nftissueSync(name2, 0, fmt(1, 0, "BBB", name), {
                authorization: name
            });
        });

        it('symbol not exists', () => {
            assert.throws(() => {
                ctx.nftissueSync(name2, 0, fmt(1, 0, "CCC", name), {
                    authorization: name
                });
            });
        });
        it('invalid issue amount', () => {
            assert.throws(() => {
                ctx.nftissueSync(name2, 0, fmt(1, 0, "AAA", name), {
                    authorization: name
                });
            });
        });

    });

    describe(`queryall`, () => {
        it('nftinfo0', () => {
            let result = fibos.getTableRowsSync({
                code: contract,
                scope: 0,
                table: "nftinfo",
                json: true,
            });
            console.log(result);
        });
        it('nftinfo1', () => {
            let result = fibos.getTableRowsSync({
                code: contract,
                scope: 1,
                table: "nftinfo",
                json: true,
            });
            console.log(result);
        });
        it('nftbalance0', () => {
            let result = fibos.getTableRowsSync({
                code: contract,
                scope: 0,
                table: "nftbalance",
                json: true,
            });
            console.log(result);
        });
        it('nftbalance1', () => {
            let result = fibos.getTableRowsSync({
                code: contract,
                scope: 1,
                table: "nftbalance",
                json: true,
            });
            console.log(result);
        });

    });

    describe(`nfttransfer`, () => {
        it('normal transfer nftBBB', () => {
            ctx.nfttransferSync(name2, name, 0, fmt(1, 0, "BBB", name), "1", {
                authorization: name2
            });
        });
        it('normal transfer nftBBB', () => {
            ctx.nfttransferSync(name2, name, 0, fmt(1, 0, "AAA", name), "2", {
                authorization: name2
            });
        });

        it('symbol not exists', () => {
            assert.throws(() => {
                ctx.nfttransferSync(name2, name, 0, fmt(1, 0, "CCC", name), "3", {
                    authorization: name2
                });
            });
        });
        it('not enough asset', () => {
            assert.throws(() => {
                ctx.nfttransferSync(name2, name, 0, fmt(111, 0, "BBB", name), "4", {
                    authorization: name2
                });
            });
        });

    });

    describe(`nfttransferb`, () => {
        it('normal transfer nftBBB', () => {
            ctx.nfttransferbSync(name2, name, [{
                nft_id: 0,
                quantity: fmt(1, 0, "BBB", name),
            }], "1", {
                authorization: name2
            });
        });
        it('not enough asset', () => {
            assert.throws(() => {
                ctx.nfttransferbSync(name2, name, [{
                    nft_id: 0,
                    quantity: fmt(111, 0, "BBB", name),
                }], "2", {
                    authorization: name2
                });
            });
        });


    });

    describe(`queryall`, () => {
        it('nftbalance0', () => {
            let result = fibos.getTableRowsSync({
                code: contract,
                scope: 0,
                table: "nftbalance",
                json: true,
            });
            console.log(result);
        });
        it('nftbalance1', () => {
            let result = fibos.getTableRowsSync({
                code: contract,
                scope: 1,
                table: "nftbalance",
                json: true,
            });
            console.log(result);
        });

    });
});

require.main === module && test.run(console.DEBUG);