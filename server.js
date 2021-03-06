var express      = require('express');
var path         = require('path');
var favicon      = require('static-favicon');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var log          = require('./config/log.js');

var app = express();
var http = require('http').Server(app);

var redis = require('redis');
client = redis.createClient();

client.on('error', function(err) {
  log.error('Error ' + err);
});

// view engine setup
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(favicon(__dirname + '/public/imgs/favicon.ico'));
// app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// socket.io setup
var io = require('socket.io')(http);
require('./app/routes/api')(io, client);

// routes
require('./app/routes/index')(app, client);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  log.error('404 error');
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


app.set('port', process.env.PORT || 9100);

// start server
http.listen(app.get('port'), function() {
  log.info('Express server listening on port ' + app.get('port'));
});
