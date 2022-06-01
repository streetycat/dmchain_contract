const test = require('test');
test.setup();

run('./nft.js');

require.main === module && test.run(console.DEBUG);