var helper = require('test/test.helper');
var should = require('should');
var sinon = require('sinon');

var DatabaseCleaner = require('database-cleaner');
var databaseCleaner = new DatabaseCleaner('redis');

var Ratings = require('app/models/ratings');
var redis = require('redis');

describe('Ratings Model', function() {
  var params = {slug: 'some:slug', rating: 5};
  var client = null;

  beforeEach(function() {
    client = redis.createClient();
    client.select(1);
  });

  afterEach(function(done) {
    databaseCleaner.clean(client, function() {
      client.end();
      client = null;
      done();
    });
  });

  describe('Ratings::build', function() {
    it('deveria criar um objeto com os dados do rating', function(done) {
      var rating = Ratings.build(params);
      rating.slug().should == 'some:slug';
      rating.slug_count().should == 'some:slug:count';
      done();
    });
  });

  describe('Ratings#save', function() {
    describe('com o banco vazio', function() {
      it('deveria ter os valores totais iguais aos valores adicionados', function(done) {
        var rating = Ratings.build(params);
        rating.save(function(err) {
          client.multi().
            get(rating.slug()).
            get(rating.slug_count()).
            exec(function(err, replies) {
              var ratings = replies[0];
              var ratings_count = replies[1];

              ratings.should == 5;
              ratings_count.should == 1;
              done();
            });
        });
      });
    });

    describe('com ratings já registrados', function() {
      var rating = Ratings.build(params);

      beforeEach(function(done) {
        client.multi().
          incrby(rating.slug(), "5").
          incrby(rating.slug_count(), "1").
          exec(done);
      });

      it('deveria somar os valores aos dados já existentes', function(done) {
        rating.save(function(err) {
          client.multi().
            get(rating.slug()).
            get(rating.slug_count()).
            exec(function(err, replies) {
              var ratings = replies[0];
              var ratings_count = replies[1];

              ratings.should == 10;
              ratings_count.should == 2;
              done();
            });
        });
      });
    });
  });
});
