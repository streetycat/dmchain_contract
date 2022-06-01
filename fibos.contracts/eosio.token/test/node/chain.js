const fibos = require("fibos");
const path = require("path")
console.log(fibos.data_dir);

fibos.load("http", {
    "verbose-http-errors": true,
    'http-server-address': '0.0.0.0:8888'
});
fibos.load("chain", {
    "delete-all-blocks": true,
    "contracts-console": true,
    "genesis-json": path.join(__dirname, "./genesis.json")
});
fibos.load("net");
fibos.load("producer", {
    'producer-name': 'eosio',
    'enable-stale-production': true,
    'max-transaction-time': 10000
});

fibos.load("chain_api");

fibos.enableJSContract = true;

fibos.start();