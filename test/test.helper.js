process.env.NODE_ENV = 'test';
process.env.REDIS_DB = '1';
process.env.RATINGS_MAX_VALUE = 5;

var request = require('request');

exports.handleServer = function(server) {
  var server = exports.server = new ServerHandler(server);
};

function ServerHandler(server, port) {
  var port = port || "9999";

  return {
    start: function(cb) {
      server.listen(port);
      return cb();
    },
    request: function(options, callback) {
      options.url = 'http://127.0.0.1:' + port + options.path;
      return request(options, callback);
    },
    stop: function(cb) {
      server.close();
      return cb();
    }
  }
}
