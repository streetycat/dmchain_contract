var test = require('test');
test.setup();

run("./lock_delegate.js");
run("./bonus.js")

test.run(console.DEBUG);