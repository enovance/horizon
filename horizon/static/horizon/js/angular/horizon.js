var horizon_dependencies = ['hz.conf', 'hz.utils', 'hz.messages', 'hz.keypair', 'hz.quota', 'ui.widget.wizard', 'ngCookies', 'ngSanitize', 'ui.bootstrap', 'ngAnimate'];

dependencies = horizon_dependencies.concat(angularModuleExtension);
var horizonApp = angular.module('hz', dependencies)
  .config(['$interpolateProvider', '$httpProvider', '$animateProvider',
    function ($interpolateProvider, $httpProvider, $animateProvider) {

      $interpolateProvider.startSymbol('{$');
      $interpolateProvider.endSymbol('$}');

      $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
      $httpProvider.defaults.xsrfCookieName = 'csrftoken';
      $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    }])
  .run(['hzConfig', 'hzUtils', 'hzMessages', '$cookieStore',
    function (hzConfig, hzUtils, hzMessages, $cookieStore) {
      //expose the configuration for horizon legacy variable
      horizon.conf = hzConfig;
      horizon.utils = hzUtils;
      horizon.msg = hzMessages;
      angular.extend(horizon.cookies = {}, $cookieStore);
      horizon.cookies.put = function (key, value) {
        //cookies are updated at the end of current $eval, so for the horizon
        //namespace we need to wrap it in a $apply function.
        angular.element('body').scope().$apply(function () {
          $cookieStore.put(key, value);
        });
      };
    }]);

