var youtube = require('youtube-node');
var secrets = require('../config/secrets');

youtube.setKey(secrets.YOUTUBE_API_KEY);

// returns the top search result for the track
module.exports.musicSearch = function(track, artist, callback) {
  youtube.search(artist  + ' - ' + track, 1, function(results) {
    var snippet = results.items[0].snippet;
    var youtube_id = results.items[0].id.videoId;

    if (snippet && youtube_id) {
      var y = {title: snippet.title, youtube_id: youtube_id};
      callback(y);
    }
  });
}
