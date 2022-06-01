var test = require('test');
var test_util = require('../../test_util');
test.setup();
describe("bill", () => {
    after(test_util.stop);
    run("./bill");
    run("./getincentive");
    run("./order");
    run("./priceavg");
});

test.run(console.DEBUG);