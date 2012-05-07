var Ratings = require('app/models/ratings');
module.exports = {
  handle: function(app) {
    app.post(/^\/([^:]+)/, Rating.create);
    app.get(/^\/([^:]+)/, Rating.show);
  }
};

var Rating = {
  create: function(req, res) {
    var slug = req.params[0].split('/').join(':');
    var data = req.body;
    data.slug = slug;

    if (!data.rating) return res.send('invalid json', {}, 400);

    var rating = Ratings.build(data);
    rating.save(function(err) {
      if (err) return res.send(err.message, {}, 500);
      return res.send(200);
    });
  },
  show: function(req, res) {
    var slug = req.params[0].split('/').join(':');
    Ratings.find(slug, function(err, rating) {
      return res.json({count: rating.count(), average: rating.average()});
    });
  }
};
