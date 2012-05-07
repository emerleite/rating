var helper = require('test/test.helper');
var should = require('should');
var sinon = require('sinon');

var DatabaseCleaner = require('database-cleaner');
var databaseCleaner = new DatabaseCleaner('redis');

var Ratings = require('app/models/ratings');
var redis = require('redis');

helper.handleServer(require('server'));

describe('Ratings Controller', function() {
  var client = null;

  beforeEach(function(done) {
    client = redis.createClient();
    client.select(1);
    helper.server.start(done);
  });

  describe('POST /^\/([^:]+)/', function() {
    it('should return 200 when save the rating', function(done) {
      var params = {slug: 'receitas:123', rating: 5};
      var rating = {save: function() {}};
      var mock = sinon.mock(rating);
      mock.expects("save").once().yields(null);

      sinon.stub(Ratings, "build").withArgs(params).returns(rating);

      helper.server.request({path: '/receitas/123', method: 'post', json: {rating: 5}}, function(error, response, body) {
        response.statusCode.should.equal(200);
        mock.verify();
        Ratings.build.restore();
        done();
      });
    });

    it('should return 400 when can not save the rating', function(done) {
      var params = {slug: 'problem:slug', rating: -1};
      var rating = {save: function() {}};
      var mock = sinon.mock(rating);
      mock.expects("save").once().yields(new Error("error saving ratings"));

      sinon.stub(Ratings, "build").withArgs(params).returns(rating);

      helper.server.request({path: '/problem/slug', method: 'post', json: {rating: -1}}, function(error, response, body) {
        response.statusCode.should.equal(500);
        body.should.equal('error saving ratings');
        mock.verify();
        Ratings.build.restore();
        done();
      });
    });

    it('should return 400 when body is not a valid json', function(done) {
      helper.server.request({path: '/good/slug', method: 'post'}, function(error, response, body) {
        response.statusCode.should.equal(400);
        body.should.equal('invalid json');
        done();
      });
    });

  });

  describe('GET /^\/([^:]+)/', function() {
    before(function(done) {
      this.rating = Ratings.build({count: 10, rating: 30});
      sinon.stub(Ratings, "find").withArgs("some:slug").yields(null, this.rating);
      done();
    });

    after(function(done) {
      Ratings.find.restore();
      done();
    });

    it('should return rating data', function(done) {
      helper.server.request({path: '/some/slug'}, function(error, response, body) {
        body.should.equal('{"count":10,"average":3}');
        done();
      });
    });
  });

  afterEach(function(done) {
    databaseCleaner.clean(client, function() {
      client.end();
      client = null;
      helper.server.stop(done);
    });
  });
});
