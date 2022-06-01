var _pubkey = 'FO6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
var _prvkey = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';

var fibos = require('fibos');

let FIBOS = require('./fibos.js');
let child_process = require('child_process');
var coroutine = require('coroutine');
var process = require('process');
var fs = require('fs');
var path = require('path');
const {
    CLIENT_RENEG_WINDOW
} = require('tls');


function new_name() {
    const base32_chars = 'abcdefghijklmnopqrstuvwxyz12345';
    var name = 'test';
    for (var i = 0; i < 8; i++)
        name += base32_chars.substr(Math.floor(Math.random() * 31), 1);
    return name;
}

function user(fibos, name, pubkey) {
    name = name || new_name();
    pubkey = pubkey || _pubkey;
    fibos.transactionSync(tr => {
        tr.newaccount({
            creator: 'eosio',
            name: name,
            owner: pubkey,
            active: pubkey
        });

        tr.buyrambytes({
            payer: 'eosio',
            receiver: name,
            bytes: 8192
        });

        tr.delegatebw({
            from: 'eosio',
            receiver: name,
            stake_net_quantity: '10.0000 FO',
            stake_cpu_quantity: '10.0000 FO',
            transfer: 0
        });
    });

    return name;
}

let p;

function stop_node() {
    if (p)
        p.kill("SIGINT");
    p = null;
}

function node() {
    if (!p) {
    } else {
        console.notice("Reset and start the node program, please wait.");
        p.kill(15);
    }

    p = child_process.fork(path.resolve(__dirname, './node/chain.js'), {
        stdio: "ignore"
    });
    let fibos = FIBOS(config);
    while (true) {
        coroutine.sleep(100);
        try {
            let info = fibos.getInfoSync();
            if (info.head_block_num === 3)
                break;
        } catch (e) { }
    }
}

const config = {
    chainId: '5de568a9259ab103ec89d0c66400346e646d7bf41db85118fc285595a16ba065', // 32 byte (64 char) hex string
    keyProvider: _prvkey, // WIF string or array of keys..
    httpEndpoint: 'http://127.0.0.1:8888',
    logger: {
        log: null,
        error: null
    }
};

function runBIOS() {
    let ctx, name, fibos;

    function deploy(fibos, account, contract, authorization, contractpath) {
        it(`deploy ${contract}@${account}`, function() {
            console.notice(path.resolve(__dirname, `${contractpath}/${contract}/${contract}.wasm`));
            var c1 = fibos.getCodeSync(account, true);
            const wasm = fs.readFile(path.resolve(__dirname, `${contractpath}/${contract}/${contract}.wasm`));
            const abi = fs.readFile(path.resolve(__dirname, `${contractpath}/${contract}/${contract}.abi`));

            fibos.setcodeSync(account, 0, 0, wasm, {
                authorization: authorization
            });
            fibos.setabiSync(account, JSON.parse(abi), {
                authorization: authorization
            });
            var c2 = fibos.getCodeSync(account, true);
            assert.notEqual(c2.code_hash, "0000000000000000000000000000000000000000000000000000000000000000");
            assert.notEqual(c2.code_hash, c1.code_hash);

            const code = fibos.getAbiSync(account);
            const diskAbi = JSON.parse(abi);
            delete diskAbi.____comment;
            if (!diskAbi.error_messages) {
                diskAbi.error_messages = [];
            }

            fibos.updateauthSync({
                account: "eosio.token",
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
                            "actor": "eosio.token",
                            "permission": "eosio.code"
                        },
                        "weight": 1
                    }]
                }
            }, {
                authorization: "eosio.token"
            })

            // assert.deepEqual(diskAbi, code.abi);
        })
    }

    describe('BIOS', () => {
        let fibos = FIBOS(config);

        before(() => {
            node();
            user(fibos, "fibos");
            user(fibos, "datamall");
            user(fibos, "eosio.token");
            user(fibos, "eosio.ram");
            user(fibos, "eosio.ramfee");
            user(fibos, "eosio.stake");
            user(fibos, "dmfoundation");
        })

        deploy(fibos, 'eosio.token', 'eosio.token', 'eosio.token', "../bin/");
    });
}

function getFIBOS() {
    return FIBOS(config);
}

function asset(str) {
    var s1 = str.split("@");
    var s2 = s1[0].split(" ");
    return {
        amount: s2[0],
        symbol: s2[1],
        contract: s1[1] || ""
    }
}

function checkstat(fibos, account, symbol, contract, expect) {
    let result = fibos.getTableRowsSync(true, "eosio.token", account, "stats")
    assert.property(result, "rows");
    result = result.rows;
    let data = {};
    for (const key in result) {

        if (result.hasOwnProperty(key)) {
            const element = result[key];
            const element2 = {};
            element2.data = element;

            ["supply", "max_supply", "max_exchange", "connector_balance", "reserve_supply", "reserve_connector_balance"].forEach((key) => {
                element2[key] = asset(`${element[key]}`);
            });

            //todo
            // assert.ok(element.connector_balance.amount < 0);
            // assert.ok(element.reserve_connector_balance.amount < 0);
            // assert.ok(element.connector_weight < 0);

            let _key = `${element2.max_supply.symbol}@${element.issuer}`;
            assert.isUndefined(data[_key]);
            data[_key] = element2;
        }
    }

    data = data[`${symbol}@${contract}`] ? data[`${symbol}@${contract}`].data : null;
    assert.deepEqual(data, expect);
}

function checkaccount(fibos, account, symbol, contract, expect) {
    let result = fibos.getTableRowsSync(true, "eosio.token", account, "accounts")
    assert.property(result, "rows");
    let data = {};
    result.rows.forEach(reslut => {
        delete reslut.primary;
        let balance = asset(reslut.balance.quantity);

        let _key = `${balance.symbol}@${reslut.balance.contract}`;
        assert.isUndefined(data[_key]);
        data[_key] = reslut.balance;
    })

    data = data[`${symbol}@${contract}`] ? data[`${symbol}@${contract}`] : null;
    assert.deepEqual(data, expect);
}


function checklockaccount(fibos, account, symbol, contract, time, expect) {
    let result = fibos.getTableRowsSync(true, "eosio.token", account, "lockaccounts")
    assert.property(result, "rows");
    let data = {};
    result.rows.forEach(reslut => {
        delete reslut.primary;
        let balance = asset(reslut.balance.quantity);
        let _key = `${balance.symbol}@${reslut.balance.contract}#${reslut.lock_timestamp}`;
        assert.isUndefined(data[_key]);
        data[_key] = {
            "balance": reslut.balance,
            "lock_timestamp": reslut.lock_timestamp
        };
    })
    data = data[`${symbol}@${contract}#${time}`] ? data[`${symbol}@${contract}#${time}`] : null;
    assert.deepEqual(data, expect);
}

function checkunswapmarket(fibos, symbolx, symboly, expect) {
    let result = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "swapmarket")
    assert.property(result, "rows");
    let data = {};
    result.rows.forEach(reslut => {
        let tokenx = reslut.tokenx.quantity.split(" ")[1] + "@" + reslut.tokenx.contract
        let tokeny = reslut.tokeny.quantity.split(" ")[1] + "@" + reslut.tokeny.contract

        let _key = `${tokenx}:${tokeny}`
        assert.isUndefined(data[_key]);
        data[_key] = reslut;
    })
    data = (data[`${symbolx}:${symboly}`] || data[`${symboly}:${symbolx}`]) ? (data[`${symbolx}:${symboly}`] || data[`${symboly}:${symbolx}`]) : null;
    assert.deepEqual(data, expect);
}

function chekcpststats(fibos, owner, expect) {
    let result = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "pststats")
    assert.property(result, "rows");
    let data = {};
    result.rows.forEach(reslut => {
        data[reslut.owner] = reslut.amount
    })
    data = data[`${owner}`] ? data[`${owner}`] : null;
    assert.deepEqual(data, expect);
}

function checkmarketpool(fibos, account, primary, expect) {
    let result = fibos.getTableRowsSync(true, "eosio.token", primary, "swappool")
    assert.property(result, "rows");
    let data = {};
    result.rows.forEach(reslut => {
        let _key = reslut.owner
        assert.isUndefined(data[_key]);
        data[_key] = {
            "owner": reslut.owner,
            "weights": reslut.weights
        }
    })
    data = data[account] ? data[account] : null;
    assert.deepEqual(data, expect);
}

function checkmarketorder(fibos, account, primary, symbol, expect) {
    let result = fibos.getTableRowsSync(true, "eosio.token", `${primary}`, "swaporder")
    assert.property(result, "rows");
    let data = {};
    result.rows.forEach(reslut => {
        let _key = `${reslut.owner}:${reslut.quantity.quantity.split(" ")[1] + "@" + reslut.quantity.contract}`
        assert.isUndefined(data[_key]);
        data[_key] = {
            "owner": reslut.owner,
            "price": reslut.price,
            "quantity": reslut.quantity
        }
    })
    data = data[`${account}:${symbol}`] ? data[`${account}:${symbol}`] : null;
    assert.deepEqual(data, expect);
}

function checkmakerstats(fibos, account, expect) {
    let result = fibos.getTableRowsSync(true, "eosio.token", "eosio.token", "dmcmaker");
    assert.property(result, "rows");
    let data = {};
    result.rows.forEach(reslut => {
        let _key = reslut.miner;
        assert.isUndefined(data[_key])
        data[_key] = {
            "miner": reslut.miner,
            "current_rate": reslut.current_rate,
            "miner_rate": reslut.miner_rate,
            "total_weight": reslut.total_weight,
            "total_staked": reslut.total_staked
        }
    })
    data = data[account] ? data[account] : null;
    assert.deepEqual(data, expect)
}

function checkmakerpool(fibos, account, miner, expect) {
    let result = fibos.getTableRowsSync(true, "eosio.token", miner, "makerpool");
    assert.property(result, "rows");
    let data = {};
    result.rows.forEach(reslut => {
        let _key = reslut.owner;
        assert.isUndefined(data[_key])
        data[_key] = {
            "onwer": reslut.owner,
            "weight": reslut.weight
        }
    })
    data = data[account] ? data[account] : null;
    assert.deepEqual(data, expect)
}

function fillnum(value, fill) {
    value = value.toString();
    let z = value.split(".")[0];
    let x = value.split(".")[1];

    x = x ? x : "";
    let l = fill - x.length;
    for (let i = 0; i < l; i++) {
        x += "0";
    }
    let rs = x.length ? z + `.${x}` : z;

    if (fill < x.length) {
        rs = Number(rs);
        rs = Math.floor(rs * Math.pow(10, fill)) / Math.pow(10, fill);
    }
    return rs;
}

function fmt(value, precision, symbol, issuer) {
    let rs = issuer ? `${fillnum(value, precision)} ${symbol}@${issuer}` : `${fillnum(value, precision)} ${symbol}`;
    return rs;
}

function fmtDate(n) {
    n = n || 2;
    return parseInt((new Date().getTime() + n * 1000) / 1000);
}

function parseDate(time) {
    return new Date(time * 1000).toISOString().split('.')[0];
}

function random_string(n) {
    let ret_str = "";
    const base32_chars = 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var i = 0; i < n; i++)
        ret_str += base32_chars.substr(Math.floor(Math.random() * base32_chars.length), 1);
    return ret_str;
}

function exchange(fibos, owner, quantity, to_token, memo, price = 0, id = "") {
    var ctx = fibos.contractSync("eosio.token");
    var result = ctx.exchangeSync({
        "owner": owner,
        "quantity": quantity,
        "to": to_token,
        "price": price,
        "id": id,
        "memo": memo
    }, {
        authorization: owner
    });
    return result;
}

function deployCont(fibos, account, contract, authorization, contractpath) {
    console.notice(path.resolve(__dirname, `${contractpath}/${contract}/${contract}.wasm`));
    var c1 = fibos.getCodeSync(account, true);
    console.log(path.resolve(__dirname, `${contractpath}/${contract}/${contract}.wasm`));
    const wasm = fs.readFile(path.resolve(__dirname, `${contractpath}/${contract}/${contract}.wasm`));
    const abi = fs.readFile(path.resolve(__dirname, `${contractpath}/${contract}/${contract}.abi`));

    fibos.setcodeSync(account, 0, 0, wasm, {
        authorization: authorization
    });
    fibos.setabiSync(account, JSON.parse(abi), {
        authorization: authorization
    });
    var c2 = fibos.getCodeSync(account, true);
    assert.notEqual(c2.code_hash, "0000000000000000000000000000000000000000000000000000000000000000");
    assert.notEqual(c2.code_hash, c1.code_hash);

    const code = fibos.getAbiSync(account);
    const diskAbi = JSON.parse(abi);
    delete diskAbi.____comment;
    if (!diskAbi.error_messages) {
        diskAbi.error_messages = [];
    }

    fibos.updateauthSync({
        account: account,
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
                    "actor": account,
                    "permission": "eosio.code"
                },
                "weight": 1
            }]
        }
    }, {
        authorization: authorization
    })
}


module.exports = {
    node: node,
    config: config,
    user: user,
    new_name: new_name,
    runBIOS: runBIOS,
    getFIBOS: getFIBOS,
    checkstat: checkstat,
    checkaccount: checkaccount,
    checklockaccount: checklockaccount,
    fmt: fmt,
    fmtDate: fmtDate,
    parseDate: parseDate,
    checkunswapmarket: checkunswapmarket,
    checkmarketpool: checkmarketpool,
    checkmarketorder: checkmarketorder,
    exchange: exchange,
    random_string: random_string,
    deployCont: deployCont,
    stop: stop_node,
    chekcpststats: chekcpststats,
    checkmakerstats: checkmakerstats,
    checkmakerpool: checkmakerpool
}
