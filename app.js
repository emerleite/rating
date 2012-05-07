var express = require('express');
var app = express.createServer();
var controllers = require('app/controllers');

app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(app.router);
});

app.use(function(err, req, res, next){
  console.log(err);
  res.send(err.status || 500, { error: err.message });
});

app.use(function(req, res){
  res.send(404, { error: "not found" });
});

controllers.handle(app);

module.exports = app;
