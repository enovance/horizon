/* Angular service for providing messages to Horizon. */

(function () {
  'use strict';

  function hzMessages ($timeout, hzMessagesTypes, hzConfig, hzUtils) {
    var that = this;

    this.alerts = [];

    function dismissAlert(alert) {
      $timeout(function () {
        var index = hzUtils.find(that.alerts, alert);
        if (index > -1 &&
          hzUtils.find(hzConfig.auto_fade_alerts.types, alert.type) > -1) {
          that.alerts.splice(index, 1);
        }
      }, hzConfig.auto_fade_alerts.delay);
    }

    function clearMessages(type) {
      var i = 0;
      while (i < that.alerts.length) {
        if (that.alerts[i].type === type) {
          that.alerts.splice(i, 1);
        } else {
          i += 1;
        }
      }
    }

    this.alert = function (msg, type) {
      type = type || hzConfig.auto_fade_alerts.default_type;
      var alert = {
        type: type,
        type_msg: hzMessagesTypes[type],
        msg: msg
      };

      dismissAlert(alert);
      this.alerts.push(alert);
      return alert;
    };

    this.clearAllMessages = function () {
      this.alerts.length = 0;
    };

    this.clearErrorMessages = function () {
      clearMessages('error');
    };

    this.clearSuccessMessages = function () {
      clearMessages('success');
    };
  }

  angular
    .module('hz.messages',
    ['hz.conf', 'hz.utils', 'ui.bootstrap', 'ngAnimate', 'ngSanitize'])

    .service('hzMessages',
    ['$timeout', 'hzMessagesTypes', 'hzConfig', 'hzUtils', hzMessages])
    .directive({
      hzMessages: ['hzMessages', function (hzMessages) {
        return {
          restrict: 'A',
          scope: {},
          templateUrl: 'template/messages/messages.html',
          link: function (scope) {
            scope.alerts = hzMessages.alerts;

            scope.closeAlert = function (index) {
              scope.alerts.splice(index, 1);
            };
          }
        };
      }],
      hzMessage: ['hzMessages', function (hzMessages) {
        return {
          restrict: 'A',
          transclude: 'element',
          scope: {
            type: '@'
          },
          link: function (scope, attr, element, ctrl, transclude) {
            transclude(function (clone) {
              hzMessages.alert(clone.html(), scope.type);
            });
          }
        };
      }]
    })
    .constant('hzMessagesTypes', {
      danger: gettext('Danger'),
      warning: gettext('Warning'),
      info: gettext('Info'),
      success: gettext('Success'),
      error: gettext('Error')
    });
}());
