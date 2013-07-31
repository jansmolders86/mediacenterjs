
var express = require('express');
var app = express();

app.use(express.cookieParser('something'));
app.use(express.session());

app.get('/', function(req, res){
  if (!req.session.n) req.session.n = Math.random();
  res.send('hello ' + req.session.n);
});

app.listen(4000);




var request = require('./');
var agent = request.agent();

var n = 3;

function next() {
  agent
  .get('http://localhost:4000/')
  .end(function(res){
    console.log(res.text);
    if (n--) process.nextTick(next);
  });
}

next();
