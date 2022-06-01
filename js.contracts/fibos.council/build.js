const FIBOS = require("fibos.js");
const fs = require("fs");
const prikey = console.readLine("请输入私钥:");
const name = "fiboscouncil";

let fibos = FIBOS({
    chainId: "6aa7bd33b6b45192465afa3553dedb531acaaff8928cf64b70bd4c5e49b7ec6a",
    httpEndpoint: "http://to-rpc.fibos.io:8870",
    keyProvider: prikey,
    logger: {
        log: null,
        error: null
    }
});

fibos.setcodeSync(name, 0, 0, fibos.compileModule("./lib/code/"), {
    authorization: name
});

let abi = JSON.parse(fs.readTextFile('./lib/index.abi'));
fibos.setabiSync(name, abi, {
    authorization: name
});