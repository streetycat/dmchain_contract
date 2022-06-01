# About

## Community

* website: https://fibos.io
* telegram: https://t.me/FIBOSIO
* twitter: https://twitter.com/fibos_io
* medium: https://medium.com/@fibosio
* issue: https://github.com/fibosio/fibos/issues


# Building contracts

----------------------------------
## Download

```sh
git clone http://git.fibos.io/fibos/contracts.git --recursive
```


If a repository is cloned without the --recursive flag, the submodules can be retrieved after the fact by running this command from within the repo:
```sh
cd contracts
git submodule update --init --recursive
```


## Update

```sh
cd contracts
git pull
git submodule update --init --recursive
```


## Build

```sh
cd contracts
bash build.sh
```

# Test

----------------------------------
### Install depend
```sh
cd contracts/fibos.contracts/eosio.token/test
fibos --install
```

### Run test case
```sh
cd contracts/fibos.contracts/eosio.token
fibos ./test/
```