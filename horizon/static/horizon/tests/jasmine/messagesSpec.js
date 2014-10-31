/*global describe, it, expect, jasmine, beforeEach, afterEach, spyOn, angular*/
describe('hz.messages', function () {
  'use strict';
  var $document;
  var hzMessages;
  var hzConfig;

  beforeEach(function () {
    angular.mock.module('hz.conf');
    //initialize hzConfig for the test
    hzConfig = {
      auto_fade_alerts: {
        types: ['success', 'info'],
        default_type: 'info',
        delay: 300
      }
    };
    angular.mock.module(function ($interpolateProvider) {
      $interpolateProvider.startSymbol('{$');
      $interpolateProvider.endSymbol('$}');
    });
    //inject the mock which will be provided to hz.hzMessages
    angular.mock.module(function ($provide) {
      $provide.constant('hzConfig', hzConfig);
    });
    angular.mock.module('hz.messages');
  });

  beforeEach(angular.mock.inject(function ($injector) {
    $document = $injector.get('$document');
    hzMessages = $injector.get('hzMessages');
  }));

  afterEach(function () {
    hzMessages.alerts.length = 0;
  });

  describe('hzMessages service', function () {
    var msg = 'This is an alert';
    var infoAlert = {msg: msg, type: 'info'};

    it('should alert messages at different levels', function () {
      hzMessages.alert(msg);
      expect(hzMessages.alerts.length).toBe(1);
      expect(hzMessages.alerts[0].type)
        .toBe(hzConfig.auto_fade_alerts.default_type);
      expect(hzMessages.alerts[0].msg).toBe(msg);

      hzMessages.alert(msg, 'danger');
      expect(hzMessages.alerts.length).toBe(2);
      expect(hzMessages.alerts[1].type).toBe('danger');
    });

    it('should provide a function which will clean all alerts', function () {
      hzMessages.alerts.push({msg: msg});
      hzMessages.alerts.push({msg: msg});
      hzMessages.alerts.push({msg: msg});
      expect(hzMessages.alerts.length).toBe(3);

      hzMessages.clearAllMessages();
      expect(hzMessages.alerts.length).toBe(0);
    });

    it('should provide a function to clear error alerts', function () {
      hzMessages.alerts.push({msg: msg, type: 'error'});
      hzMessages.alerts.push(infoAlert);
      hzMessages.alerts.push({msg: msg, type: 'error'});

      expect(hzMessages.alerts.length).toBe(3);

      hzMessages.clearErrorMessages();

      expect(hzMessages.alerts.length).toBe(1);
      expect(hzMessages.alerts[0]).toEqual(infoAlert);
    });

    it('should provide a function to clear success alerts', function () {
      hzMessages.alerts.push({msg: msg, type: 'success'});
      hzMessages.alerts.push({msg: msg, type: 'success'});
      hzMessages.alerts.push(infoAlert);

      expect(hzMessages.alerts.length).toBe(3);

      hzMessages.clearSuccessMessages();

      expect(hzMessages.alerts.length).toBe(1);
      expect(hzMessages.alerts[0]).toEqual(infoAlert);
    });

    xit('should provide a function to clear a specific alert', function () {
      hzMessages.alerts.push({msg: msg, type: 'error'});
      hzMessages.alerts.push(infoAlert);

      hzMessages.closeAlert(1);

      expect(hzMessages.alerts.length).toBe(1);
      expect(hzMessages.alerts[0]).not.toEqual(infoAlert);
    });

    it('should dismiss specific kinds of alerts after a delay',
      angular.mock.inject(function ($timeout) {
        var totalDelay = hzConfig.auto_fade_alerts.delay;
        var errorAlert = hzMessages.alert(msg, 'error');

        hzMessages.alert(msg, 'info');
        hzMessages.alert(msg, 'success');

        expect(hzMessages.alerts.length).toBe(3);

        $timeout(function () {
          expect(hzMessages.alerts.length).toBe(1);
          expect(hzMessages.alerts[0]).toEqual(errorAlert);
        }, totalDelay);

        $timeout.flush(totalDelay);
      }));
  });

  describe('hzMessages directive', function () {
    var $scope;
    var elm;

    function alerts() {
      return elm.find('.alert.alert-block');
    }

    function alertsMsg() {
      var contents = [];
      alerts().find('span[ng-bind-html="alert.msg"]').each(function () {
        contents.push($(this).html());
      });
      return contents;
    }

    beforeEach(
      angular.mock.inject(function ($rootScope, $compile) {
        /*
          We need to compile the templates in order to fulfill the
          $templateCache.
         */
        $compile($('#templates').html())($rootScope);

        elm = $compile('<div data-hz-messages></div>')($rootScope);
        $rootScope.$apply();
        $scope = elm.isolateScope();

        this.addMatchers({
          toHaveClass: function (cls) {
            this.message = function () {
              return ['Expected "', this.actual, '"',
                this.isNot ? ' not ' : ' ', 'to have class "', cls, '".']
                .join('');
            };
            return this.actual.hasClass(cls);
          }
        });
      }));

    it('should have an isolated scope initialized', function () {
      expect($scope).toBeDefined();
      expect($scope.alerts).toBeDefined();
      expect($scope.closeAlert).toBeDefined();
    });

    it('should have the alerts variable bound to hzMessages alerts',
      function () {
        var alert = hzMessages.alert('alert');
        expect($scope.alerts.length).toBe(1);
        expect($scope.alerts[0]).toBe(alert);

        var alert2 = hzMessages.alert('alert2', 'info');
        expect($scope.alerts.length).toBe(2);
        expect($scope.alerts[1]).toBe(alert2);
        expect(alert2.msg).toBe('alert2');
        expect(alert2.type).toBe('info');
      });

    it('should display the content of the alerts variable in specific widgets',
      function () {
        hzMessages.alert('alert', 'info');
        hzMessages.alert('alert2', 'error');
        $scope.$apply();
        expect(alerts().length).toBe(2);
        expect(alerts().eq(0)).toHaveClass('alert-info');
        expect(alerts().eq(1)).toHaveClass('alert-error');
        expect(alertsMsg()).toEqual(['alert', 'alert2']);
      });

    it('should be possible to inject html in the message', function () {
      hzMessages.alert('<h1>info</h1>');
      $scope.$apply();
      expect(alerts().length).toBe(1);
      expect(alertsMsg()).toEqual(['<h1>info</h1>']);
    });

    it('should be possible to remove an alert by clicking close', function () {
      hzMessages.alert('<h1>info</h1>');
      $scope.$apply();
      expect(alerts().length).toBe(1);
      alerts().eq(0).find('.close').click();
      $scope.$apply();
      expect(alerts().length).toBe(0);
    });
  });

  describe('hzMessage directive', function () {

    it('should allow templates to be transcluded in the hzMessage service',
      angular.mock.inject(function ($rootScope, $compile) {
        var msg = 'here a message';
        $compile(['<div data-hz-message type="info">', msg, '</div>']
          .join(''))($rootScope);
        $rootScope.$apply();

        expect(hzMessages.alerts.length).toBe(1);
        expect(hzMessages.alerts[0].msg).toBe(msg);
        expect(hzMessages.alerts[0].type).toBe('info');
      }));
  });
});