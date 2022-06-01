const test = require('test');
test.setup();

run('./pass.js');
run('./pass_destroy.js');

run('./parameter_create.js');
run('./parameter_issue.js');
run('./parameter_destroy.js');
run('./parameter_exchange.js');
run('./parameter_retire.js');
run('./parameter_close.js');

run('./permission_retire.js');
run('./permission_destroy.js');
// run('./parameter_lock.js');


require.main === module && test.run(console.DEBUG);