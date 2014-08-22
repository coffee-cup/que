var log = require('../../config/log');
var lastfm = require('../lastfm');
var youtube = require('../youtube');
var utils = require('../utils');
var shortId = require('shortId');
var moment = require('moment');

var API = '/api/';

module.exports = function(io, client) {
  io.on('connection', function(socket) {
    log.info('a user connected');

    // called when user wants to generate a new page
    socket.on('create_page', function(data) {
      var track = {
        video_id: 'pco91kroVgQ',
        track: 'Applause',
        artist: 'Lady Gaga'
      };
      var page_id = shortId.generate();
      client.rpush(page_id, JSON.stringify(track));
      socket.emit('new_page', {
        page_id: page_id
      });
      log.info('created new page with id ' + page_id);
    });

    // addes a new track to the queue for the key
    socket.on('queue', function(data) {
      var key = data.key;

      if (!key) {
        return;
      }

      track = data.track;
      if (track) {
        log.info('will starting queueing ' + track.track + ' - ' + track.artist);
        youtube.musicSearch(track.track, track.artist, function(y) {
          if (!y) {
            log.error('error getting video ' + track.artist + ' - ' + track.track);
            return;
          }

          var t = {
            track: track.track,
            artist: track.artist,
            video_id: y.id.videoId
          }

          log.info('getting specific video info');
          youtube.videoInfo(t.video_id, function(info) {
            info = info.items[0];
            if (info.contentDetails) {
              var isodur = info.contentDetails.duration;
              var time = utils.convertDuration(isodur);
              var duration = moment.duration({
                seconds: time.S,
                minutes: time.M,
                hours: time.H
              });

              console.log(duration.asSeconds());

              client.get(key + '-queuetime', function(err, extime) {
                if (err) log.error(err);

                // the key time exists
                if (extime) {
                  var queue_end_time = extime + duration.asSeconds();
                  console.log(queue_end_time);
                  client.set(key + '-queuetime', queue_end_time);
                }else {
                  // key time does not exist,
                  // so just use duration + current time for expirey
                var queue_end_time = moment().unix() + duration.asSeconds();
                client.set(key + '-queuetime', queue_end_time);
                }
              });
            }
          });
          // var t = JSON.stringify(y);
          // io.emit(key + '-queue', [t]);
          // client.rpush(key, t);
        });
      }
    });

    // returns the full queue for the key
    socket.on('get_queue', function(data) {
      var key = data.key;
      if (key) {
        client.lrange(key, 0, -1, function(err, mqueue) {
          socket.emit(key + '-queue', mqueue);
        });
      }
    });

    // will process list of tracks and send message back
    // to socket with id given
    function processTracks(tracks) {
      tracks.status = 'success';
      log.info('send back search results to ' + socket.id);
      socket.emit('search_results', tracks);
    }

    // will emit null to clients
    function noResults() {
      log.info('sending back no results found');
      socket.emit('search_results', {
        status: 'failure'
      })
    }

    socket.on('search', function(data) {
      var key = data.key;

      if (!key) {
        return;
      }

      log.info('recived search');

      // TODO: normalize these values
      var track = data.track;
      var artist = data.artist;

      if (!track && artist) {
        log.info('just artist provided');
        // just get artists top tracks
        lastfm.getMethod('artist.gettoptracks', {
          artist: artist
        }, function(data) {
          var tracks = data.toptracks.track;
          if (tracks) {
            var ts = [];
            for (var i = 0; i < tracks.length; i++) {
              var t = {};
              t.track = tracks[i].name;
              t.artist = tracks[i].artist.name;
              ts.push(t);
            }

            processTracks(ts);
          } else {
            noResults();
          }
        });
      } else {
        log.info('track and artist provided');
        // search for track using track name and artist
        lastfm.getMethod('track.search', {
          track: track,
          artist: artist
        }, function(data) {
          if (data.results) {
            var tracks = data.results.trackmatches.track;
            if (tracks) {
              var ts = [];
              for (var i = 0; i < tracks.length; i++) {
                var t = {};
                t.track = tracks[i].name;
                t.artist = tracks[i].artist;
                ts.push(t);
              }
              processTracks(ts);
            } else {
              noResults();
            }
          } else {
            noResults();
          }
        });
      }
    });
  });
}
