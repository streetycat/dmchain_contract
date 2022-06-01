const contract_name = "fiboscouncil";
const filter_names = [contract_name, "huobideposit", "otcbtcdotcom", "okbtothemoon", "binancecleos"];

let validate = (from, to, quantity, contract, memo) => {
    if (to !== contract_name) return;

    assert.equal(action.account, "eosio.token");

    assert.equal(contract, "eosio");

    assert.equal(quantity.split(" ")[1], "EOS");

    let name = memo.split(",")[0];

    assert.isTrue(!!name && (/^(?=^[.a-z1-5]{1,12}$)([a-z1-5]+?([.]{0,1}[a-z1-5]+?)?)$/.test(name)));

    assert.isTrue(!filter_names.includes(name));
};

module.exports = {
    on_extransfer: (from, to, quantity, memo) => validate(from, to, quantity.quantity, quantity.contract, memo),
    on_transfer: (from, to, quantity, memo) => validate(from, to, quantity, "eosio", memo)
};