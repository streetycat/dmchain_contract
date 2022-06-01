var FIBOS = require('fibos.js');

Object.assign(FIBOS.modules.json.schema, {
    retire: {
        "base": "",
        "action": {
            "name": "retire",
            "account": "eosio.token"
        },
        "fields": {
            "quantity": "asset",
            "memo": "string"
        }
    },
    close: {
        "base": "",
        "action": {
            "name": "close",
            "account": "eosio.token"
        },
        "fields": {
            "owner": "account_name",
            "symbol": "symbol"
        }
    },
    excreate: {
        "base": "",
        "action": {
            "name": "excreate",
            "account": "eosio.token"
        },
        "fields": {
            "issuer": "account_name",
            "maximum_supply": "asset",
            "reserve_supply": "asset",
            "expiration": "time_point_sec",
        }
    },
    exunlock: {
        "base": "",
        "action": {
            "name": "exunlock",
            "account": "eosio.token"
        },
        "fields": {
            "owner": "account_name",
            "quantity": "extended_asset",
            "expiration": "time_point_sec",
            "memo": "string"
        }
    },
    exlocktrans: {
        "base": "",
        "action": {
            "name": "exlocktrans",
            "account": "eosio.token"
        },
        "fields": {
            "from": "account_name",
            "to": "account_name",
            "quantity": "extended_asset",
            "expiration": "time_point_sec",
            "expiration_to": "time_point_sec",
            "memo": "string"
        }
    },
    exissue: {
        "base": "",
        "action": {
            "name": "exissue",
            "account": "eosio.token"
        },
        "fields": {
            "to": "account_name",
            "quantity": "extended_asset",
            "memo": "string"
        }
    },
    extransfer: {
        "base": "",
        "action": {
            "name": "extransfer",
            "account": "eosio.token"
        },
        "fields": {
            "from": "account_name",
            "to": "account_name",
            "quantity": "extended_asset",
            "memo": "string"
        }
    },
    exretire: {
        "base": "",
        "action": {
            "name": "exretire",
            "account": "eosio.token"
        },
        "fields": {
            "from": "account_name",
            "quantity": "extended_asset",
            "memo": "string"
        }
    },
    exclose: {
        "base": "",
        "action": {
            "name": "exclose",
            "account": "eosio.token"
        },
        "fields": {
            "owner": "account_name",
            "symbol": "extended_symbol"
        }
    },
    exdestroy: {
        "base": "",
        "action": {
            "name": "exdestroy",
            "account": "eosio.token"
        },
        "fields": {
            "symbol": "extended_symbol"
        }
    },
    exchange: {
        "base": "",
        "action": {
            "name": "exchange",
            "account": "eosio.token"
        },
        "fields": {
            "owner": "account_name",
            "quantity": "extended_asset",
            "to": "extended_asset",
            "price": "float64",
            "id": "account_name",
            "memo": "string"
        }
    },
    receipt: {
        "base": "",
        "action": {
            "name": "receipt",
            "account": "eosio.token"
        },
        "fields": {
            "in": "extended_asset",
            "out": "extended_asset"
        }
    },
    snapshot: {
        "base": "",
        "action": {
            "name": "snapshot",
            "account": "eosio.token"
        },
        "fields": {
            "contract": "account_name",
            "max_supply": "asset",
            "cw": "float64",
            "max_exchange": "asset",
            "supply": "asset",
            "reserve_supply": "asset",
            "connector_balance": "asset",
            "reserve_connector_balance": "asset"
        }
    },
    exlock: {
        "base": "",
        "action": {
            "name": "exlock",
            "account": "eosio.token"
        },
        "fields": {
            "owner": "account_name",
            "quantity": "extended_asset",
            "expiration": "time_point_sec",
            "memo": "string"
        }
    },
    addreserves: {
        "base": "",
        "action": {
            "name": "addreserves",
            "account:": "eosio.token"
        },
        "fields": {
            "owner": "account_name",
            "tokenx": "extended_asset",
            "tokeny": "extended_asset"
        }
    }
});

module.exports = FIBOS;
