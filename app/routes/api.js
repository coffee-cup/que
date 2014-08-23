var log = require('../../config/log');
var lastfm = require('../lastfm');
var youtube = require('../youtube');
var utils = require('../utils');
var shortId = require('shortId');
var moment = require('moment');

var API = '/api/';

module.exports = function(io, client) {

  // a user has connected to the page
  io.on('connection', function(socket) {
    log.info('a user connected');

    // called when user wants to generate a new page
    socket.on('create_page', function(data) {
      var page_id = shortId.generate();
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
          youtube.videoInfo(t.video_id, function(item) {
            if (item.contentDetails) {
              var isodur = item.contentDetails.duration;
              var time = utils.convertDuration(isodur);
              var duration = moment.duration({
                seconds: time.S,
                minutes: time.M,
                hours: time.H
              });

              client.get(key + '-queuetime', function(err, extime) {
                if (err) log.error(err);

                // the key time exists
                if (extime) {
                  extime = parseInt(extime);

                  if (moment().unix() > extime) {
                    // the queue has not had songs
                    // so just use now as start for expiry time
                    var queue_end_time = moment().unix() + duration.asSeconds();
                  } else {
                    // there are currently songs in the queue
                    // so use the expirey time cached
                    var queue_end_time = parseInt(extime) + duration.asSeconds();
                  }
                } else {
                  // key time does not exist,
                  // so just use duration + current time for expirey
                  var queue_end_time = moment().unix() + duration.asSeconds();
                }
                client.set(key + '-queuetime', queue_end_time);

                // send the video to each client in the same queue
                t.extime = queue_end_time;
                t.duration = duration.asSeconds();
                t = JSON.stringify(t);
                io.emit(key + '-queue', [t]);
                log.info('sending new track to queue - ' + key);
                client.zadd(key, queue_end_time, t);
              });
            }
          });
        });
      }
    });

    // returns the full queue for the key
    socket.on('get_queue', function(data) {
      var key = data.key;
      var now = moment().unix();
      if (key) {
        client.zrangebyscore([key, '(' + now, '+inf'], function(err, mqueue) {
          if (err) log.error(err);

          socket.emit(key + '-queue', mqueue);
        });
      }
    });

    // will process list of tracks and send message back
    // to socket with id given
    function processTracks(tracks) {
      if (tracks) {
        tracks.status = 'success';
        log.info('sending back search results to ' + socket.id);
        socket.emit('search_results', tracks);
      } else {
        log.info('sending back failure for search results to ' + socket.id);
        socket.emit('search_results', {status: 'failure', message: 'your search came up empty'});
      }
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
        // just get artists top tracks
        lastfm.artistTopTracks(artist, processTracks);
      } else {
        // search for track using track name and artist
        lastfm.trackSearch(track, artist, processTracks);
      }
    });
  });
}
