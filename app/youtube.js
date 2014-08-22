var request = require('request');
var secrets = require('../config/secrets');
var API_ROOT = 'https://www.googleapis.com/youtube/v3/'

// returns the top search result for the track
module.exports.musicSearch = function(track, artist, callback) {
  var params = {
    q: artist + ' - ' + track,
    part: 'snippet',
    key: secrets.YOUTUBE_API_KEY,
    maxResults: 1
  };

  request({
    url: API_ROOT + 'search',
    json: true,
    qs: params
  }, function(error, response, body) {
    if (error) log.error(error);

    if (body.items) {
      var item = body.items[0];
      callback(item);
    }else {
      callback(null);
    }
  });
}

// gets information for 1 video id
module.exports.videoInfo = function(video_id, callback) {
  var params = {part: 'contentDetails', id: video_id, key: secrets.YOUTUBE_API_KEY};

  request({url: API_ROOT + 'videos', json: true, qs: params}, function(error, response, body) {
    if (error) log.error(error);

    if (body.items) {
      var item = body.items[0];
      callback(item);
    }else {
      callback(null);
    }
  });
}
