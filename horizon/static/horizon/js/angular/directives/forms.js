/*globals horizonApp*/
(function () {
  'use strict';
  horizonApp.
    directive({
      notBlank: function () {
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        function isEmpty(obj) {

          // null and undefined are "empty"
          if (obj == null) return true;

          // Assume if it has a length property with a non-zero value
          // that that property is correct.
          if (obj.length > 0)    return false;
          if (obj.length === 0)  return true;

          // Otherwise, does it have any properties of its own?
          // Note that this doesn't handle
          // toString and valueOf enumeration bugs in IE < 9
          for (var key in obj) {
              if (hasOwnProperty.call(obj, key)) return false;
          }

          return true;
        }

        return {
          require: 'ngModel',
          link: function (scope, elm, attrs, ctrl) {
            var validator = function (value) {
              if (isEmpty(value)) {
                ctrl.$setValidity('notBlank', false);  
                return;
              } else {
                ctrl.$setValidity('notBlank', true);  
                return value;
              }
            }
            ctrl.$formatters.push(validator);
            ctrl.$parsers.unshift(validator);
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