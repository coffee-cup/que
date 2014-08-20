var log = require('../../config/log');
var music = require('../music.js');
var youtube = require('../youtube.js');

var API = '/api/';

module.exports = function(io) {
  var clients = {};

  io.on('connection', function(socket) {
    log.info('a user connected');

    socket.on('queue', function(track) {
      track = track.track;
      if (track) {
        log.info('will starting queueing ' + track.name + ' - ' + track.artist);
        youtube.musicSearch(track.name, track.artist, function(y) {
          console.log(y);
        });
      }
    });

    socket.on('get_queue', function(data) {
      var data = [{video_id: 'qhnFl3Y2FVI'}, {video_id: 'fx6oykKGag8'}];
      socket.emit('video_queue', data);
      console.log(data);
    });

    // will process list of tracks and send message back
    // to socket with id given
    function processTracks(tracks) {
      log.info('send back search results to ' + socket.id);
      socket.emit('search_results', tracks);
    }

    socket.on('search', function(data) {
      log.info('recived search');

      // TODO: normalize these values
      var track = data.track;
      var artist = data.artist;

      if (!track && artist) {
        log.info('just artist provided');
        // just get artists top tracks
        music.getMethod('artist.gettoptracks', {artist:artist}, function(data) {
          var tracks = data.toptracks.track;
          if (tracks) {
            var ts = [];
            for (var i=0;i<tracks.length;i++) {
              var t = {};
              t.name = tracks[i].name;
              t.artist = tracks[i].artist.name;
              ts.push(t);
            }

            console.log(ts);

            processTracks(ts);
          }else {

          }
        });
      } else {
        log.info('track and artist provided');
        // search for track using track name and artist
        music.getMethod('track.search', {track: track, artist: artist}, function(data) {
          var tracks = data.results.trackmatches.track;
          if (tracks) {
            var ts = [];
            for (var i=0;i<tracks.length;i++) {
              var t ={};
              t.name = tracks[i].name;
              t.artist = tracks[i].artist;
              ts.push(t);
            }

            processTracks(ts);
          }else {

          }
        });
      }
    });
  });
}
