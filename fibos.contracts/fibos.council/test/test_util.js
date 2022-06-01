var _pubkey = 'FO6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
var _prvkey = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';

var fibos = require('fibos');

let FIBOS = require('./fibos.js');
var coroutine = require('coroutine');
var process = require('process');
var fs = require('fs');
var path = require('path');

if (process.argv[1] === __filename) {
    console.log(fibos.data_dir);

    fibos.load("http", {
        "verbose-http-errors": true,
        'http-server-address': '0.0.0.0:8888'
    });
    fibos.load("chain", {
        "delete-all-blocks": true,
        "contracts-console": true
    });
    fibos.load("net");
    fibos.load("producer", {
        'producer-name': 'eosio',
        'enable-stale-production': true,
        'max-transaction-time': 10000
    });

    fibos.load("chain_api");
    fibos.load("history_api");

    fibos.enableJSContract = true;

    fibos.start();
}

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

function node() {
    if (!p) {
        process.on('beforeExit', exitCode => {
            p.kill(15);
            p.wait();
        });
    } else {
        console.notice("Reset and start the node program, please wait.");
        p.kill(15);
        p.wait();
    }

    p = process.start(process.argv[0], [__filename]);
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
    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f', // 32 byte (64 char) hex string
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
        it(`deploy ${contract}@${account}`, function () {
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

            const code = fibos.getAbiSync(account);
            const diskAbi = JSON.parse(abi);
            delete diskAbi.____comment;
            if (!diskAbi.error_messages) {
                diskAbi.error_messages = [];
            }

            // assert.deepEqual(diskAbi, code.abi);
        })
    }

    describe('BIOS', () => {
        let fibos = FIBOS(config);

        before(() => {
            node();
            user(fibos, "fibos");
            user(fibos, "eosio.token");
            user(fibos, "eosio.ram");
            user(fibos, "eosio.ramfee");
            user(fibos, "eosio.stake");
            user(fibos, "fiboscouncil");
        })

        deploy(fibos, 'eosio.token', 'eosio.token', 'eosio.token', "../../eosio.token/bin/");
        deploy(fibos, 'fiboscouncil', 'fibos.council', 'fiboscouncil', "../bin/");
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

function checkctxaccount(fibos, account, symbol, contract, expect) {
    let result = fibos.getTableRowsSync(true, "eosio.token", account, "ctxaccounts")
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
    checkctxaccount: checkctxaccount,
    fmt: fmt,
    fmtDate: fmtDate,
    parseDate: parseDate
}