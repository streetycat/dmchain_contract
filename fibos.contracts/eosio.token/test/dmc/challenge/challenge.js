let test = require('test');
test.setup();

let test_util = require('../../test_util');
const hash = require("hash");
const eosjs_ecc = require("eosjs-ecc");
var _pubkey = 'FO6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
var _prvkey = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';
const coroutine = require("coroutine")
test_util.runBIOS();

describe(`challenge`, () => {
    let contract;
    let fibos, ctx, user, miner;
    let data = [];
    let merkle_tree = [];
    let nonce = test_util.random_string(6);
    let order_id = 0;

    before(() => {
        fibos = test_util.getFIBOS();
        contract = "eosio.token";
        user = test_util.user(fibos);
        miner = test_util.user(fibos);
        ctx = fibos.contractSync(contract);
        for (let i = 0; i < 4; i++) {
            data.push(test_util.random_string(9));
        }
        ctx.excreateSync("datamall", `1000000000 PST`, `0 PST`, 0, {
            authorization: "datamall"
        })
        ctx.excreateSync("datamall", `1000000000.0000 DMC`, `0.0000 DMC`, 0, {
            authorization: "datamall"
        })
        ctx.excreateSync("datamall", `1000000000.00000000 RSI`, `0.00000000 RSI`, 0, {
            authorization: "datamall"
        })

    });

    it("generate merkle tree", () => {
        let hash_array = [];
        for (let i = 0; i < data.length; i++) {
            hash_array.push(eosjs_ecc.sha256(data[i] + i));
        }
        merkle_tree.push(hash_array);
        for (let i = 0; i < merkle_tree.length; i++) {
            let merkle_level = merkle_tree[i];
            let upper_nodes = [];
            if (merkle_level.length == 1) {
                break;
            }
            for (let j = 0; j < merkle_level.length; j += 2) {
                upper_nodes.push(eosjs_ecc.sha256(merkle_level[j] + merkle_level[j + 1]))
            }
            merkle_tree.push(upper_nodes);
        }
    })

    it("addorder", () => {
        ctx.exissueSync(miner, `150 PST@datamall`, `issue 150 PST`, {
            authorization: "datamall"
        });
        ctx.exissueSync(user, `100000.0000 DMC@datamall`, `issue 100000 DMC`, {
            authorization: "datamall"
        });

        ctx.billSync(miner, "100 PST@datamall", 2, "test", {
            authorization: miner
        });
        coroutine.sleep(2 * 1000);
        let bill_id = fibos.getTableRowsSync(true, contract, miner, "stakerec").rows[0].bill_id;
        ctx.orderSync({
            "owner": user,
            "miner": miner,
            "bill_id": bill_id,
            "asset": "30 PST@datamall",
            "memo": "test"
        }, {
            authorization: user
        });
        let order_info = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcorder").rows;
        order_id = order_info[0].order_id;
    })

    describe(`addmerkle`, () => {
        it("user should add merkle first", () => {
            assert.throws(() => {
                ctx.addmerkleSync({
                    sender: miner,
                    order_id: order_id,
                    merkle_root: merkle_tree[merkle_tree.length - 1][0]
                }, {
                    authorization: miner
                });
            });
        });

        it("user add merkle", () => {
            ctx.addmerkleSync({
                sender: user,
                order_id: order_id,
                merkle_root: merkle_tree[merkle_tree.length - 1][0]
            }, {
                authorization: user
            });
        })

        it("miner add merkle", () => {
            ctx.addmerkleSync({
                sender: miner,
                order_id: order_id,
                merkle_root: merkle_tree[merkle_tree.length - 1][0]
            }, {
                authorization: miner
            });
        })
    })

    describe(`submitproof`, () => {
        it("user submit proof", () => {
            let data_hash = eosjs_ecc.sha256(data[2] + nonce);
            let sign = eosjs_ecc.signHash(data_hash, _prvkey);
            ctx.submitproofSync({
                sender: user,
                order_id: order_id,
                data_id: 2,
                key: _pubkey,
                sign: sign,
                nonce: nonce,
            }, {
                authorization: user
            });
            let result = fibos.getTableRowsSync(true, contract, contract, "dmchallenge")
            console.log(result)
        });
    })

    describe(`replyproof`, () => {
        xit("miner reply proof success", () => {
            let data_hash = eosjs_ecc.sha256(data[2] + nonce);
            ctx.replyproofSync({
                sender: miner,
                order_id: order_id,
                reply_hash: data_hash
            }, {
                authorization: miner
            });
            let result = fibos.getTableRowsSync(true, contract, contract, "dmcorder")
            console.log(result)
        });

        it("miner reply proof fail", () => {
            let data_hash = eosjs_ecc.sha256(data[3] + nonce);
            ctx.replyproofSync({
                sender: miner,
                order_id: order_id,
                reply_hash: data_hash
            }, {
                authorization: miner
            });
            let result = fibos.getTableRowsSync(true, contract, contract, "dmcorder")
            console.log(result)
        });
    })

    describe(`challenge`, () => {
        it("miner challenge", () => {
            ctx.challengeSync({
                sender: miner,
                order_id: order_id,
                data_id_str: "2",
                data: Buffer.from(data[2]),
                cut_merkle: [
                    [
                        merkle_tree[0][2],
                        merkle_tree[0][3]
                    ],
                    [
                        merkle_tree[1][0],
                        merkle_tree[1][1],
                    ],
                    [
                        merkle_tree[2][0]
                    ]
                ]
            }, {
                authorization: miner
            });
            let result = fibos.getTableRowsSync(true, contract, contract, "dmchallenge")
            console.log(result)
        });
    })
});

require.main === module && test.run(console.DEBUG);