var request = require('request');
var log = require('../config/log');
var secrets = require('../config/secrets')

var API_ROOT   = 'http://ws.audioscrobbler.com/2.0/';
var LIMIT      = 3;

module.exports.getMethod = function(method, params, callback) {
  params['api_key'] = secrets.LASTFM_API_KEY;
  params['format']  = 'json';
  params['method']  = method;
  params['limit']   = LIMIT;

  log.info('making api call to lastfm');
  request({url: API_ROOT, json: true, qs: params}, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    callback(body);
  }else {
    log.error('There was an error making call to lastfm');
  }
});
}
