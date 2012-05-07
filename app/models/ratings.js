var redis = require('redis');
client = redis.createClient();
client.select(process.env.REDIS_DB || "0");

module.exports = {
  build : function(params) {
    return new Ratings(params);
  },
  find: function(slug, callback) {
    var rating = new Ratings({slug: slug});

    client.multi().
      get(rating.slug()).
      get(rating.slug_count()).
      exec(function(err, replies) {
        if (!replies[0] || !replies[1]) return callback(null, null);

        var rating = new Ratings({
          slug: slug,
          rating: replies[0],
          count: replies[1]
        });
        return callback(null, rating);
      });
  }
};

function Ratings(params) {
  var slug = params.slug;
  var slug_count = slug + ':count';
  var value = params.rating;
  var count = parseInt(params.count, 10);

  var maxValue = process.env.RATINGS_MAX_VALUE || null;

  return {
    slug: function() {
      return slug;
    },
    slug_count: function() {
      return slug_count;
    },
    save: function(callback) {
      if (value <= 0) return callback(new Error('rating must be greater than 0'));
      if (maxValue && value > maxValue) return callback(new Error('rating must be at most ' + maxValue));

      client.multi().
        incrby(slug, value).
        incr(slug_count).
        exec(callback);
    },
    average: function() {
      return value / count;
    },
    count: function() {
      return count;
    }
  }
}
