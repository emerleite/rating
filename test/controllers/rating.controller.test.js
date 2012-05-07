var helper = require('test/test.helper');
var should = require('should');
var sinon = require('sinon');

var DatabaseCleaner = require('database-cleaner');
var databaseCleaner = new DatabaseCleaner('redis');
var Ratings = require('app/models/ratings');

helper.handleServer(require('app'));

describe('Main controller', function() {
  beforeEach(function(done) {
    helper.server.start(done);
  });

  it('should return 200 when save the rating', function(done) {
    var params = {slug: 'receitas:123'};
    var rating = {save: function() {}};
    var mock = sinon.mock(rating);
    mock.expects("save").once().yields(null);

    sinon.stub(Ratings, "build").withArgs(params).returns(rating);

    helper.server.request({path: '/receitas/123', method: 'post'}, function(error, response, body) {
      response.statusCode.should.equal(200);
      mock.verify();
      Ratings.build.restore();
      done();
    });
  });

  it('should return 400 when can not save the rating', function(done) {
    var params = {slug: 'problem:slug'};
    var rating = {save: function() {}};
    var mock = sinon.mock(rating);
    mock.expects("save").once().yields(new Error());

    sinon.stub(Ratings, "build").withArgs(params).returns(rating);

    helper.server.request({path: '/problem/slug', method: 'post'}, function(error, response, body) {
      response.statusCode.should.equal(400);
      mock.verify();
      Ratings.build.restore();
      done();
    });
  });

  afterEach(function(done) {
    helper.server.stop(done);
  });
});
