angular.module('queueController.controller', [])
  .controller('queueController', function($scope, $window, $routeParams) {

    // force a new connect to socketio
    // required for angularjs page changing
    var socket = io.connect('', {
      'force new connection': true
    });
    $scope.queue = [];
    $scope.playing = null;
    $scope.isPlaying = false;
    $scope.no_results = false;
    $scope.connected = false;

    // set the header background color
    var color = intToARGB(hashCode($routeParams.key));
    $('.banner').css('background', '#' + color);

    // Hash any string into an integer value
    function hashCode(str) {
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    }

    // Convert an int to hexadecimal with a max length
    // of six characters.
    function intToARGB(i) {
      var h = ((i >> 24) & 0xFF).toString(16) +
        ((i >> 16) & 0xFF).toString(16) +
        ((i >> 8) & 0xFF).toString(16) +
        (i & 0xFF).toString(16);
      return h.substring(0, 6);
    }

    // safe apply to check if already in progress
    $scope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if (phase == '$apply' || phase == '$digest') {
        if (fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };

    $scope.$on('$destroy', function(event) {
      // disconnect socket when leaving page
      if (player) {
        player.destroy();
      }
    });

    function convertToObjects(list_of_jsons) {
      for (var i = 0; i < list_of_jsons.length; i++) {
        list_of_jsons[i] = JSON.parse(list_of_jsons[i]);
      }
      return list_of_jsons;
    }

    socket.on('connect', function() {
      $scope.safeApply(function() {
        $scope.connected = true;
        if (YT && YT.Player) {
          player = new YT.Player('player', {
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange
            }
          });
        }
      });
    });

    socket.on('disconnect', function() {
      $scope.safeApply(function() {
        $scope.connected = false;
      });
    });

    socket.on('search_results', function(data) {
      $scope.safeApply(function() {
        if (data.status == 'failure' || !data) {
          $scope.no_results = true;
        } else {
          $scope.no_results = false;
          $scope.searches = data;
        }
      });
    });

    socket.on($routeParams.key + '-queue', function(data) {
      if (!data || data.status == 'failure') {
        // the video queuing did not work
        return;
      }

      data = convertToObjects(data);
      $scope.safeApply(function() {
        if ($scope.queue.length == 0 && !$scope.isPlaying) {
          $scope.queue = $scope.queue.concat(data);
          loadNextVideo();
        } else {
          $scope.queue = $scope.queue.concat(data);
        }
      });
    });

    $scope.search = function(track, artist) {
      socket.emit('search', {
        artist: artist,
        track: track,
        key: $routeParams.key
      });
    }

    $scope.queueTrack = function(t) {
      socket.emit('queue', {
        track: t,
        key: $routeParams.key
      });
    }

    function loadVideo(video_obj) {
      $scope.playing = video_obj;
      $scope.isPlaying = true;
      player.loadVideoById(video_obj.video_id);

      // this syncs the times with other clients
      // based on the expirey time of the video
      var now = new Date().getTime() / 1000;
      var ex = parseInt(video_obj.extime);
      var diff = ex - now;
      var duration = parseInt(video_obj.duration);
      player.seekTo(duration - diff, true);
    }

    function loadNextVideo() {
      if (player) {
        // queue would be 0 on first load of the page
        if ($scope.queue.length > 0) {
          loadVideo($scope.queue.shift());
        } else {
          $scope.playing = null;
          $scope.isPlaying = false;
        }
      }
    }

    $scope.gotAll = false;

    function getAllQueue() {
      if (!$scope.gotAll && player) {
        $scope.gotAll = true;
        socket.emit('get_queue', {
          key: $routeParams.key
        });
      }
    }

    // youtube javascript api v3

    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    var player;

    $window.onYouTubeIframeAPIReady = function() {
      player = new YT.Player('player', {
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    }

    // 4. The API will call this function when the video player is ready.
    $window.onPlayerReady = function(event) {
      getAllQueue();
    }

    // 5. The API calls this function when the player's state changes.
    //    The function indicates that when playing a video (state=1),
    //    the player should play for six seconds and then stop.
    var done = false;

    $window.onPlayerStateChange = function(event) {
      if (event.data == YT.PlayerState.ENDED) {
        $scope.safeApply(function() {
          loadNextVideo();
        });
      }
    }

    $window.stopVideo = function() {
      player.stopVideo();
    }
  });
