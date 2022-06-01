/**
 *  @file
 *  @copyright defined in fibos/LICENSE.txt
 */
#pragma once
#include <string>
#include <eosiolib/eosio.hpp>
#include <eosiolib/asset.hpp>
#include <eosiolib/crypto.h>
#include <eosiolib/currency.hpp>
#include <eosiolib/singleton.hpp>
#include <eosiolib/transaction.hpp>

namespace eosio {

static const account_name eos_account = N(eosio);
static const extended_symbol eos_sym = extended_symbol(S(4, EOS), eos_account);
constexpr size_t max_name_length = 12;
const char period_symbol = '.';
const std::string council_account = "fiboscouncil";

class council : public contract {

public:
    council(account_name self)
        : contract(self){};

public:
    void on_transfer();
    void on_ex_transfer();

private:
    struct extransfer {
        account_name from;
        account_name to;
        extended_asset quantity;
        string memo;
    };
    void check_transfer_data(account_name from, account_name to, asset quantity, string memo);
    bool is_valid_name(std::string name);
};

} /// eosio
