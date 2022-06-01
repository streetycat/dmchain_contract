const test = require('test');
test.setup();

run("./deliver.js");

require.main === module && test.run(console.DEBUG);