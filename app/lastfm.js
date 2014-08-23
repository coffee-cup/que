var request = require('request');
var log = require('../config/log');
var secrets = require('../config/secrets')

var API_ROOT = 'http://ws.audioscrobbler.com/2.0/';
var LIMIT = 10;

module.exports.getMethod = function(method, params, callback) {
  params['api_key'] = secrets.LASTFM_API_KEY;
  params['format'] = 'json';
  params['method'] = method;
  params['limit'] = LIMIT;

  log.info('making api call to lastfm - ' + method);
  request({
    url: API_ROOT,
    json: true,
    qs: params
  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      log.info('got response from lastfm');
      callback(body);
    } else {
      log.error('There was an error making call to lastfm');
    }
  });
}

// get track information from lastfm
module.exports.trackInfo = function(track, artist, callback) {
  var params = {
    api_key: secrets.LASTFM_API_KEY,
    format: 'json',
    method: 'track.getinfo',
    artist: artist,
    track: track
  }

  log.info('get track info for: ' + track);
  request({url: API_ROOT, json: true, qs: params}, function(error, response, body) {
    if (!error && response.statusCode == 200 && body) {
      callback(body);
    }else {
      callback(null);
    }
  });
}


// search for a track with artist and track
module.exports.trackSearch = function(track, artist, callback) {
  var params = {
    api_key: secrets.LASTFM_API_KEY,
    format: 'json',
    method: 'track.search',
    limit: LIMIT,
    artist: artist,
    track: track
  }

  log.info('searching for track: ' + track + ' with artist: ' + artist);
  request({
    url: API_ROOT,
    json: true,
    qs: params
  }, function(error, response, body) {
    if (!error && response.statusCode == 200 && body) {
      if (body.results.trackmatches.track) {
        var tracks = body.results.trackmatches.track;
        var ts = [];

        // if there is only one track returned,
        // tracks is not a array, its just an object
        if (!tracks.length) {
          tracks = [tracks];
        }

        for (var i = 0; i < tracks.length; i++) {
          var t = {};
          t.track = tracks[i].name;
          t.artist = tracks[i].artist;
          ts.push(t);
        }
        callback(ts);
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

// get the top tracks for the artist
module.exports.artistTopTracks = function(artist, callback) {
  var params = {
    api_key: secrets.LASTFM_API_KEY,
    format: 'json',
    method: 'artist.gettoptracks',
    limit: LIMIT,
    autocorrect: 1,
    artist: artist
  }

  log.info('getting top tracks from ' + artist);
  request({
    url: API_ROOT,
    json: true,
    qs: params
  }, function(error, response, body) {
    if (!error && response.statusCode == 200 && body) {
      if (body.toptracks) {
        var tracks = body.toptracks.track;
        if (tracks) {
          if (!tracks.length) {
            tracks = [tracks];
          }

          var ts = [];
          for (var i = 0; i < tracks.length; i++) {
            var t = {};
            t.track = tracks[i].name;
            t.artist = tracks[i].artist.name;
            t.track_mbid = tracks[i].mbid;
            ts.push(t);
          }
          callback(ts);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}
