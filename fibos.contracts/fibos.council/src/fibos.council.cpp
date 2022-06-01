#include <fibos.council/fibos.council.hpp>

namespace eosio {

void council::on_transfer()
{
    const currency::transfer& t = unpack_action_data<currency::transfer>();
    check_transfer_data(t.from, t.to, t.quantity, t.memo);
}

void council::check_transfer_data(account_name from, account_name to, asset quantity, string memo)
{
    if (from == _self) {
        return;
    }
    eosio_assert(to == _self, "Invalid require_recipient account_name");
    eosio_assert(S(4, EOS) == quantity.symbol, "Invalid symbol");
    eosio_assert(is_valid_name(memo), "Invalid memo");
}

bool council::is_valid_name(std::string memo)
{
    if (memo.empty())
        return false;

    std::string name = memo;
    auto pos = memo.find(",");
    if (pos != std::string::npos) {
        name = memo.substr(0, pos);
    }
    if (name.empty())
        return false;

    int name_length = name.length();
    if (name_length > max_name_length)
        return false;

    if (name == council_account)
        return false;

    if (name.front() == period_symbol || name.back() == period_symbol)
        return false;

    std::size_t pos1 = name.find(period_symbol);
    if (pos1 != std::string::npos) {
        if (name.find(period_symbol, pos1 + 1) != std::string::npos)
            return false;
    }

    std::string legal_char(".12345abcdefghijklmnopqrstuvwxyz");
    for (int i = 0; i < name_length; i++) {
        std::size_t found = legal_char.find(name[i]);
        if (found == std::string::npos)
            return false;
    }
    return true;
}

extern "C" {
void apply(uint64_t receiver, uint64_t code, uint64_t action)
{
    auto _self = receiver;
    if (action == N(onerror)) {
        eosio_assert(code == N(eosio), "onerror action's are only valid from the \"eosio\" system account");
    }
    if (code == N(eosio.token)) {
        council t(_self);
        if (action == N(transfer)) {
            t.on_transfer();
        }
    }
}
}
}