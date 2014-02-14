/*globals horizonApp*/
(function () {
  'use strict';
  horizonApp.
    directive({
      notBlank: function () {
        return {
          require: 'ngModel',
          link: function (scope, elm, attrs, ctrl) {
            ctrl.$setValidity('notBlank', false);
            ctrl.$parsers.unshift(function (viewValue) {
              if (viewValue.length) {
                // it is valid
                ctrl.$setValidity('notBlank', true);
              } else {
                ctrl.$setValidity('notBlank', false);
                viewValue = undefined;
              }
              return viewValue;
            });
          }
        };
      },
      identity: function () {
        return {
          require: 'ngModel',
          link: function (scope, elm, attrs, ctrl) {
            scope.$watch(attrs.identity, function (value) {
              ctrl.$setValidity('identity', ctrl.$viewValue === value);
            });
            ctrl.$parsers.unshift(function (viewValue) {
              if (viewValue === scope.$eval(attrs.identity)) {
                ctrl.$setValidity('identity', true);
              } else {
                ctrl.$setValidity('identity', false);
                viewValue = undefined;
              }
              return viewValue;
            });
          }
        };
      },
      into: function () {
        return {
          require: 'ngModel',
          link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue) {
              var names = scope.$eval(attrs.into), l = names.length, i;
              for (i = 0; i < l; i += 1) {
                if (viewValue === names[i]) {
                  ctrl.$setValidity('into', false);
                  return undefined;
                }
              }
              ctrl.$setValidity('into', true);
              return viewValue;
            });
          }
        };
      }
    });
}());