var test = require('test');
var test_util = require('../../test_util');
test.setup();
describe("abo", () => {
    after(test_util.stop);
    run("./allocation");
    run("./setstats");
});

test.run(console.DEBUG);