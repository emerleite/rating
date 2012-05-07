var redis = require('redis');
client = redis.createClient();
client.select(process.env.REDIS_DB || "0");

module.exports = {
  build : function(params) {
    return new Ratings(params);
  }
};

function Ratings(params) {
  console.log(params);

  var slug = params.slug;
  var slug_count = slug + ':count';
  var value = params.rating;

  return {
    slug: function() {
      return slug;
    },
    slug_count: function() {
      return slug_count;
    },
    save: function(callback) {
      client.multi().
        incrby(slug, value).
        incr(slug_count).
        exec(function(err) {
          return callback(err);
        });
    }
  }
}
