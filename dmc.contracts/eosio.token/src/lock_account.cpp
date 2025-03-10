#include <eosio.token/eosio.token.hpp>

namespace eosio {
void token::exlock(account_name owner, extended_asset quantity, time_point_sec expiration, string memo)
{
    require_auth(owner);

    eosio_assert(quantity.is_valid(), "invalid quantity");
    eosio_assert(quantity.amount > 0, "must lock positive amount");

    eosio_assert(memo.size() <= 256, "memo has more than 256 bytes");

    require_recipient(quantity.contract);

    stats statstable(_self, quantity.contract);
    const auto& st = statstable.get(quantity.get_extended_symbol().name(), "token with symbol does not exist");

    sub_balance(owner, quantity);
    lock_add_balance(owner, quantity, expiration, owner);

    statstable.modify(st, 0, [&](auto& s) {
        if (s.reserve_supply.symbol != s.supply.symbol)
            s.reserve_supply = quantity;
        else
            s.reserve_supply += quantity;
        s.supply -= quantity;
    });
}

void token::exlocktrans(account_name from, account_name to, extended_asset quantity, time_point_sec expiration, time_point_sec expiration_to, string memo)
{
    eosio_assert(from != to, "cannot transfer lock tokens to self");
    require_auth(from);

    eosio_assert(is_account(to), "cannot transfer lock tokens to nonexist account");

    require_recipient(from);
    require_recipient(to);

    eosio_assert(quantity.is_valid(), "invalid quantity when transfer lock tokens");
    eosio_assert(quantity.amount > 0, "must transfer lock tokens in positive quantity");
    eosio_assert(memo.size() <= 256, "memo has more than 256 bytes");
    if (time_point_sec(now()) < expiration) {
        eosio_assert(expiration_to >= expiration, "expiration_to must longer than expiration");
    }

    if (expiration_to == time_point_sec())
        lock_sub_balance(from, quantity, true);
    else
        lock_sub_balance(from, quantity, expiration);

    lock_add_balance(to, quantity, expiration_to, from);
}

void token::exunlock(account_name owner, extended_asset quantity, time_point_sec expiration, string memo)
{
    require_auth(owner);

    eosio_assert(quantity.is_valid(), "invalid quantity");
    eosio_assert(quantity.amount > 0, "must unlock positive amount");

    eosio_assert(time_point_sec(now()) >= expiration, "under expiration time");

    eosio_assert(memo.size() <= 256, "memo has more than 256 bytes");

    require_recipient(quantity.contract);

    stats statstable(_self, quantity.contract);
    const auto& st = statstable.get(quantity.get_extended_symbol().name(), "token with symbol does not exist");

    lock_sub_balance(owner, quantity, expiration);
    add_balance(owner, quantity, owner);

    statstable.modify(st, 0, [&](auto& s) {
        s.reserve_supply -= quantity;
        s.supply += quantity;
    });
}

void token::lock_sub_balance(account_name owner, extended_asset value, time_point_sec expiration)
{
    lock_accounts from_acnts(_self, owner);
    auto from_iter = from_acnts.get_index<N(byextendedasset)>();
    auto from = from_iter.find(lock_account::key(value.get_extended_symbol(), expiration));

    eosio_assert(from != from_iter.end(), "no such lock tokens");
    eosio_assert(from->balance.amount >= value.amount, "overdrawn balance when sub lock balance");
    eosio_assert(from->balance.symbol == value.symbol, "symbol precision mismatch");

    if (from->balance.amount == value.amount) {
        from_iter.erase(from);
    } else {
        from_iter.modify(from, 0, [&](auto& a) {
            a.balance -= value;
        });
    }
}

void token::lock_add_balance(account_name owner, extended_asset value, time_point_sec expiration, account_name ram_payer)
{
    lock_accounts to_acnts(_self, owner);
    auto to_iter = to_acnts.get_index<N(byextendedasset)>();
    auto to = to_iter.find(lock_account::key(value.get_extended_symbol(), expiration));

    if (to == to_iter.end()) {
        to_acnts.emplace(ram_payer, [&](auto& a) {
            a.primary = to_acnts.available_primary_key();
            a.balance = value;
            a.lock_timestamp = expiration;
        });
    } else {
        to_iter.modify(to, 0, [&](auto& a) {
            a.balance += value;
        });
    }
}

void token::lock_sub_balance(account_name foundation, extended_asset quantity, bool recur)
{
    lock_accounts from_acnts(_self, foundation);

    auto from_iter = from_acnts.get_index<N(byextendedasset)>();
    auto from = from_iter.lower_bound(lock_account::key(quantity.get_extended_symbol(), time_point_sec()));

    eosio_assert(quantity.get_extended_symbol() == from->balance.get_extended_symbol(), "symbol precision mismatch");
    while (quantity.amount > 0) {
        eosio_assert(from != from_iter.end(), "overdrawn balance when lock_sub");

        if (recur)
            eosio_assert(time_point_sec(now()) >= from->lock_timestamp, "under expiration time");

        quantity -= from->balance;
        if (quantity.amount >= 0) {
            from = from_iter.erase(from);
        } else {
            from_iter.modify(from, 0, [&](auto& a) {
                a.balance.amount = std::abs(quantity.amount);
            });
        }
    }
}

extended_asset token::get_balance(extended_asset quantity, account_name name)
{
    accounts acnts(_self, name);

    auto iter = acnts.get_index<N(byextendedasset)>();
    auto it = iter.find(account::key(quantity.get_extended_symbol()));

    if (it == iter.end())
        return extended_asset(0, quantity.get_extended_symbol());

    eosio_assert(it->balance.symbol == quantity.symbol, "symbol precision mismatch");

    return it->balance;
}
}