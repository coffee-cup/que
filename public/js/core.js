  var que = angular.module('que', ['ngRoute',
    'fitVids',
    'homeController.controller',
    'queueController.controller'
  ]);

  // configure our routes
  que.config(function($routeProvider, $locationProvider) {
    $routeProvider

    .when('/:key', {
      templateUrl: 'views/queue.html',
      controller: 'queueController'
    })

    .when('/', {
      templateUrl: 'views/home.html',
      controller: 'homeController'
    })

    .otherwise({
      redirectTo: '/'
    });

    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
  });
