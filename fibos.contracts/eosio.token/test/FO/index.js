const test = require('test');
test.setup();

run('./pass.js');
run('./transfer_special_acount.js');

run('./parameter_create.js');

require.main === module && test.run(console.DEBUG);