const test = require('test');
test.setup();

run("./challenge.js");

require.main === module && test.run(console.DEBUG);