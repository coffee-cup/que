angular.module('homeController.controller', [])
  .controller('homeController', function($scope, $window) {

    var socket = io();
    $scope.queue = [];

    socket.on('connect', function() {
      console.log('connected to server');
    });

    socket.on('search_results', function(data) {
      $scope.$apply(function() {
        $scope.tracks = data;
      });
    });

    socket.on('video_queue', function(data) {
      console.log('got new video(s)');
      $scope.queue = $scope.queue.concat(data);
      console.log($scope.queue);
      loadNextVideo();
    });

    $scope.search = function(track, artist) {
      socket.emit('search', {
        artist: artist,
        track: track
      });
    }

    function loadVideo(video_obj) {
      player.loadVideoById(video_obj.video_id);
    }


    $scope.queueTrack = function(t) {
      socket.emit('queue', {
        track: t
      });
    }

    function loadNextVideo() {
      if (player) {
        // queue would be 0 on first load of the page
        if ($scope.queue.length > 0) {
          console.log('queue not empty, loading next video');
          loadVideo($scope.queue.pop());
        }
      }
    }

    // youtube javascript api v3

    // get height to keep aspect ratio 16:9
    function getHeight(width) {
      return width / (16 / 9);
    }

    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    var player;

    $window.onYouTubeIframeAPIReady = function() {
      var width = $('.player-wrapper').width();
      var height = getHeight(width);

      player = new YT.Player('player', {
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    }

    // 4. The API will call this function when the video player is ready.
    $window.onPlayerReady = function(event) {
      console.log('player ready');
      socket.emit('get_queue', {});
      $('#player').removeClass('hidden');
    }

    // 5. The API calls this function when the player's state changes.
    //    The function indicates that when playing a video (state=1),
    //    the player should play for six seconds and then stop.
    var done = false;

    $window.onPlayerStateChange = function(event) {
      if (event.data == YT.PlayerState.ENDED) {
        loadNextVideo();
      }
    }

    $window.stopVideo = function() {
      player.stopVideo();
    }
  });
