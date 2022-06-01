const test = require('test');
test.setup();

run('./pass.js');
run('./pass_contract.js');
run('./pass_unlock.js');

run('./parameter_excreate.js');
run('./parameter_exchange.js');
run('./parameter_extransfer.js');
run('./parameter_exunlock.js');
run('./parameter_precision.js');
run('./parameter_new_exchange.js');

run('./permission_create.js');
run('./permission_exchange.js');
run('./permission_contract.js');

run('./error_exchange.js');
run('./parameter_exlocktrans.js');
run('./parameter_exretire.js');
run('./parameter_exdestroy.js');
run('./parameter_exshare.js');
run('./parameter_setfee.js');
run('./parameter_setposition.js');

run('./fix/exdestroy_close.js');
run('./fix/unlimited_unlock.js');
run('./fix/record.test.js');
run('./fix/exunlock.js');
run('./fix/stable_coin.js');

require.main === module && test.run(console.DEBUG);
