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
    it('should create a Rating object with it data', function(done) {
      var rating = Ratings.build(params);
      rating.slug().should == 'some:slug';
      rating.slug_count().should == 'some:slug:count';
      done();
    });
  });

  describe('Ratings#save', function() {
    describe('with empty database', function() {
      it('should have rating and rating count as same as added', function(done) {
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

    describe('with previous rating values', function() {
      var rating = Ratings.build(params);

      beforeEach(function(done) {
        client.multi().
          incrby(rating.slug(), "5").
          incrby(rating.slug_count(), "1").
          exec(done);
      });

      it('should increment the values', function(done) {
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

    describe('with negative rating value' , function() {
      var rating = Ratings.build({slug: 'some:slug', rating: -1});

      it('should return with error', function(done) {
        rating.save(function(err) {
          should.exist(err);
          err.message.should.equal('rating must be greater than 0');
          done();
        });
      });
    });

    describe('when zero rating value', function() {
      var rating = Ratings.build({slug: 'some:slug', rating: 0});

      it('should return with error', function(done) {
        rating.save(function(err) {
          should.exist(err);
          err.message.should.equal('rating must be greater than 0');
          done();
        });
      });
    });

    describe('when value greater than max alowed', function() {
      var rating = Ratings.build({slug: 'some:slug', rating: process.env.RATINGS_MAX_VALUE + 1});

      it('should return with error', function(done) {
        rating.save(function(err) {
          should.exist(err);
          err.message.should.equal('rating must be at most ' + process.env.RATINGS_MAX_VALUE);
          done();
        });
      });
    });

    describe('when max value is not defined', function() {
      before(function() {
        this.maxValue = process.env.RATINGS_MAX_VALUE;
        process.env.RATINGS_MAX_VALUE = null;
        this.rating = Ratings.build({slug: 'some:slug', rating: 99999})
      });

      it('should allow any value', function(done) {
        this.rating.save(function(err) {
          should.not.exist(err);
          done();
        });
      });

      before(function() {
        process.env.RATINGS_MAX_VALUE = this.maxValue;
      });
    });
  });

  describe('Ratings::find', function() {
    describe('when record not exists yet', function() {
      it('should return null', function(done) {
        Ratings.find(params.slug, function(err, rating) {
          should.not.exist(rating);
          done();
        });
      });
    });

    describe('when record exists', function() {
      var rating = Ratings.build(params);

      beforeEach(function(done) {
        client.multi().
          incrby(rating.slug(), "8").
          incrby(rating.slug_count(), "2").
          exec(done);
      });

      it('should return an object with it values', function() {
        Ratings.find(rating.slug(), function(err, existingRating) {
          existingRating.slug().should.equal(rating.slug());
          existingRating.slug_count().should.equal(rating.slug_count());
        });
      });
    })
  });

  describe('Ratings#count', function() {
    var rating = Ratings.build(params);
    beforeEach(function(done) {
      client.multi().
        incrby(rating.slug(), "8").
        incrby(rating.slug_count(), "2").
        exec(done);
    });

    it('should retorn the rating count', function(done) {
      Ratings.find(rating.slug(), function(err, existingRating) {
        existingRating.count().should.equal(2);
        done();
      });
    });
  });

  describe('Ratings#average', function() {
    var rating = Ratings.build(params);

    describe('when division without rest', function() {
      beforeEach(function(done) {
        client.multi().
          incrby(rating.slug(), "8").
          incrby(rating.slug_count(), "2").
          exec(done);
      });

      it('should return an integer number', function(done) {
        Ratings.find(rating.slug(), function(err, existingRating) {
          existingRating.average().should.equal(4);
          done();
        });
      })
    });

    describe('when division with rest', function() {
      beforeEach(function(done) {
        client.multi().
          incrby(rating.slug(), "5").
          incrby(rating.slug_count(), "2").
          exec(done);
      });

      it('should return a decimal number', function(done) {
        Ratings.find(rating.slug(), function(err, existingRating) {
          existingRating.average().should.equal(2.5);
          done();
        });
      })
    });
  });
});
