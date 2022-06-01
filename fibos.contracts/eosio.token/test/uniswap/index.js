const test = require('test');
test.setup();

run("./add_out.js");
run("./add_out_yq.js")
run("./order_pass.js");
run("./order_from_pass.js");
run("./market_pass.js");
run("./market_pass_yq.js");
run("./order_precision.js");
run("./inverse_order.js");
run("./fix_error_order.js");
run("./swaplock.js");

require.main === module && test.run(console.DEBUG);
