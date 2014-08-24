angular.module('homeController.controller', [])
  .controller('homeController', function($scope, $location, $http) {
    $scope.createPage = function() {
      $http.post('/createPage').success(function(data) {
        if (data) {
          $location.path('/' + data.page_id);
        }
      });
    }
  });
