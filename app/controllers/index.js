var Ratings = require('app/models/ratings');

module.exports = {
  handle: function(app) {
    app.post(/^\/([^:]+)/, Rating.create);
    app.get('/', function(req, res){
      res.send('hello world');
    });
  }
};

var Rating = {
  create: function(req, res) {
    var slug = req.params[0].split('/').join(':');
    var rating = Ratings.build({slug: slug});
    console.log('slug:' + slug);

    rating.save(function(err) {
      if (!err) {
        res.send(200);
      } else {
        res.send(400);
      }
    });
  }
};
