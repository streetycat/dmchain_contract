const FIBOS = require('fibos.js');
const test = require('test');
const fs = require('fs');
test.setup();

const CONFIG = {
    test1: {
        name: "1ojduidpvmzt",
        pubkey: "FO8JXTR8Hz6HRkGzEFXNSWztm3xpD65gCk28gS4xN31qEvLkufuF",
        prikey: "5JjdZQy9x4k6sxU5JpSiET221knJRtUs433UfRfNmpUXjrxC7t3"
    },
    main: {
        name: "pualgezwdtpd",
        pubkey: "FO8djwUZMsuBQYZLVxBFx37C7YtkkEnbbgp6xEUVnr1iFrFu4c7u",
        prikey: "5JgsbS155MmHUQjRqgihWn2JhLjQkCz8F4sv9yy1MXaKUWdh2B5"
    }
}

let getClient = (prikey) => {
    return FIBOS({
        chainId: "68cee14f598d88d340b50940b6ddfba28c444b46cd5f33201ace82c78896793a",
        httpEndpoint: "http://testnet.fibos.fo",
        keyProvider: prikey
    });
};

let main_name = CONFIG.main.name;
let test_name = CONFIG.test1.name;

let main_client = getClient(CONFIG.main.prikey);
let test_client = getClient(CONFIG.test1.prikey);

describe("正则测试", () => {
    it("正则测试", () => {
        let reg = /^(?=^[.a-z1-5]{1,12}$)([a-z1-5]+?([.]{0,1}[a-z1-5]+?)?)$/;

        assert.isTrue(reg.test("a"));
        assert.isTrue(reg.test("b1"));
        assert.isTrue(reg.test("eosio"));
        assert.isTrue(reg.test("fibos"));
        assert.isTrue(reg.test("eosio.token"));
        assert.isTrue(reg.test("fiboscouncil"));
        assert.isTrue(reg.test("fibos.ouncil"));

        assert.isTrue(!reg.test("fibos."));
        assert.isTrue(!reg.test(".fibos"));
        assert.isTrue(!reg.test(".fibosouncil"));
        assert.isTrue(!reg.test("fibosouncil."));
        assert.isTrue(!reg.test("fib..scounci"));
        assert.isTrue(!reg.test("fib.s.counci"));
        assert.isTrue(!reg.test("fib.1.counci"));
        assert.isTrue(!reg.test("fiboscouncila"));
        assert.isTrue(!reg.test("fiboscoun..."));

        assert.isTrue(!reg.test("fib1234567"));
        assert.isTrue(!reg.test("FIBOS"));
        assert.isTrue(!reg.test("656561"));
        assert.isTrue(!reg.test("156561"));
    })
})

describe('部署合约', () => {
    it("部署合约", () => {
        main_client.setcodeSync(main_name, 0, 0, main_client.compileModule("../lib/code/"), {
            authorization: main_name
        });
    });

    it("部署abi", () => {
        let abi = JSON.parse(fs.readTextFile('../lib/index.abi'));
        main_client.setabiSync(main_name, abi, {
            authorization: main_name
        });
    })
});

describe("成功转账", () => {
    it("测试成功转账", () => {
        let ctx = test_client.contractSync("eosio.token");
        let s_money = test_client.getTableRowsSync(true, "eosio.token", main_name, "accounts").rows[0].balance.quantity.split(" ")[0];

        let r = ctx.transferSync(test_name, main_name, "0.0001 EOS", "fibosmaster1");
        assert.equal(r.broadcast, true);

        let e_money = test_client.getTableRowsSync(true, "eosio.token", main_name, "accounts").rows[0].balance.quantity.split(" ")[0];

        assert.equal(Number(s_money) + 0.0001, Number(e_money));


        r = ctx.transferSync(test_name, main_name, "0.0001 EOS", "fibos");
        assert.equal(r.broadcast, true);

        e_money = test_client.getTableRowsSync(true, "eosio.token", main_name, "accounts").rows[0].balance.quantity.split(" ")[0];
        assert.equal(Number(s_money) + 0.0002, Number(e_money));

        ctx.transferSync(test_name, main_name, "0.0001 EOS", "fibos,wangxin");
        assert.equal(r.broadcast, true);

        e_money = test_client.getTableRowsSync(true, "eosio.token", main_name, "accounts").rows[0].balance.quantity.split(" ")[0];
        assert.equal(Number(s_money) + 0.0003, Number(e_money));

        //memo 为中文的转账

        ctx.transferSync(test_name, main_name, "0.0001 EOS", "fibos,测试memo");
        assert.equal(r.broadcast, true);

        e_money = test_client.getTableRowsSync(true, "eosio.token", main_name, "accounts").rows[0].balance.quantity.split(" ")[0];
        assert.equal(Number(s_money) + 0.0004, Number(e_money));
    });
});

describe('错误转账', () => {
    let ctx = test_client.contractSync("eosio.token");

    describe("memo 格式错误", () => {
        it("账号错误", () => {
            assert.throws(() => {
                ctx.transferSync(test_name, main_name, "0.0001 EOS", "1234566");
            });
        })

        it("memo 以. 开头或结尾", () => {
            assert.throws(() => {
                ctx.transferSync(test_name, main_name, "0.0001 EOS", ".fibos");
            });

            assert.throws(() => {
                ctx.transferSync(test_name, main_name, "0.0001 EOS", "fibos.");
            })
        });
    });

    it("币种错误", () => {
        let ctx = test_client.contractSync("eosio.token");

        let r = ctx.exchangeSync(test_name, "0.0010 EOS@eosio", "0.0000 FO@eosio", "");
        assert.equal(r.broadcast, true);

        assert.throws(() => {
            r = ctx.transferSync(test_name, main_name, "0.0001 FO", "fibosmaster1");
        });
    });

    it("转账到交易所", () => {
        let ctx = test_client.contractSync("eosio.token");

        assert.throws(() => {
            let r = ctx.transferSync(test_name, main_name, "0.0001 EOS", "huobideposit");
        });

        assert.throws(() => {
            let r = ctx.transferSync(test_name, main_name, "0.0001 EOS", "huobideposit,123456");
        });
    });
});

test.run(console.DEBUG);