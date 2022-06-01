var test = require('test');
test.setup();

run("./smart");
run("./classic");
run("./FO");

test.run(console.DEBUG);