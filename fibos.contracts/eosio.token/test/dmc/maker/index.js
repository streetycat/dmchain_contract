var test = require('test');
var test_util = require('../../test_util');
test.setup();
describe("maker", () => {
    after(test_util.stop);
    run("./maker");
    run("./mint");
    run("./liquidation")
});

test.run(console.DEBUG);