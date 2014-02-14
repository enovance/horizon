/*global angular*/
var horizonApp = angular.module(
    'hz',
    ['hz.conf',
      'hz.utils',
      'hz.messages',
      'ui.bootstrap',
      'ngAnimate',
      'ngSanitize']
  ).config(['$interpolateProvider', function ($interpolateProvider) {
    $interpolateProvider.startSymbol('{$');
    $interpolateProvider.endSymbol('$}');
  }]).run(['hzConfig', 'hzUtils', 'hzMessages',
    function (hzConfig, hzUtils, hzMessages) {
      //expose the configuration for horizon legacy variable
      horizon.conf = hzConfig;
      horizon.utils = hzUtils;
      horizon.msg = hzMessages;
    }]);
