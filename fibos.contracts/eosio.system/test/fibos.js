var FIBOS = require('fibos.js');

Object.assign(FIBOS.modules.json.schema, {
    claimbonus: {
        "base": "",
        "action": {
            "name": "claimbonus",
            "account": "eosio"
        },
        "fields": {
            "owner": "account_name"
        }
    },
    setbonusrate: {
        "base": "",
        "action": {
            "name": "setbonusrate",
            "account": "eosio"
        },
        "fields": {
            "annual_rate": "float64"
        }
    }
});

module.exports = FIBOS;
