angular.module('homeController.controller', [])
  .controller('homeController', function($scope, $location) {

    var socket = io();

    socket.on('new_page', function(page) {
      console.log(page.page_id);
      $scope.$apply(function() {
        $location.path('/' + page.page_id);
      });
    });

    $scope.createPage = function() {
      socket.emit('create_page', {});
    }

  });
