var server = require('server');
var port = process.env.PORT || "3000";
console.log('Server started at http://0.0.0.0:' + port);
server.listen(port);
