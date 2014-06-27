/*globals horizonApp*/
(function () {
  'use strict';
  horizonApp.
    directive('notBlank', function () {
      return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
          ctrl.$parsers.unshift(function (viewValue) {
            if (viewValue.length) {
              // it is valid
              ctrl.$setValidity('notBlank', true);
              return viewValue;
            }
            // it is invalid, return undefined (no model update)
            ctrl.$setValidity('notBlank', false);
            return undefined;
          });
        }
      };
    });

  horizonApp.directive('draggableNetwork', function() {
    return function(scope, element, attr){
      console.log(scope);
      console.log(element);
      console.log(attr);

      element.on('mousedown', function(event) {
        event.preventDefault();
//        $document.on('mousemove', mousemove);
//        $document.on('mouseup', mouseup);
      });

    };
  });
}());