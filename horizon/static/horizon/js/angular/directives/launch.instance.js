/*globals angular */
angular.module('hz').directive({
  selection: [function () {

    return {
      restrict: 'A',
      require: ['selection', 'ngModel' ],
      transclude: true,
      scope: {
        availables: '=elts',
        id: '@',
        label: '@'
      },
      controller: function () {},
      template:
          '<div id="{$ id $}" class="selection">\n' +
          '  <label for="selected_{$ id $}">Selected {$ label $}</label>\n' +
          '  <ul id="selected_{$ id $}" class="selected">\n' +
          '    <li ng-if="!selected.length" data-selection-help-transclude></li>\n' +
          '    <li ng-repeat="s in selected"><div data-selection-element-transclude data-elt="s"></div></li>\n' +
          '  </ul>\n' +
          '  <label for="available_{$ id $}">Available {$ label $}</label>\n' +
          '  <ul id="available_{$ id $}" class="available">\n' +
          '    <li ng-repeat="a in availables"><div data-selection-element-transclude data-elt="a"></div></li>\n' +
          '  </ul>\n' +
          '</div>\n' +
          '<div ng-transclude></div>\n',
      link: function (scope, element, attrs, controllers) {
        var selectionCtrl = controllers[0];
        var modelCtrl = controllers[1];

        scope.selected = modelCtrl.$modelValue || [];
        selectionCtrl.toggle = function (elt) {
          var index = scope.availables.indexOf(elt);
          if (index !== -1) {
            scope.selected.push(elt);
            scope.availables.splice(index, 1);
          } else {
            index = scope.selected.indexOf(elt);
            scope.selected.splice(index, 1);
            scope.availables.unshift(elt);
          }
          modelCtrl.$setViewValue(scope.selected);
        }
      }
    };
  }],
  selectionElement: [function () {
    return {
      require: '^selection',
      transclude: true,
      link: function (scope, element, attrs, selectionCtrl, transclude) {
        selectionCtrl.$transcludeElt = transclude;
      }
    };
  }],
  selectionElementTransclude: ['$compile', function ($compile) {
    return {
      scope: {
        elt: '='
      },
      require: '^selection',
      link: function (scope, element, attrs, selectionCtrl) {
        scope.$watch('elt', function () {
          selectionCtrl.$transcludeElt(function (clone) {
            element.html($compile(clone)(scope));
          });
        });
        
        element.bind('click', function () {
          scope.$apply(function () {
            selectionCtrl.toggle(scope.elt);
          });
        });
      }
    }
  }],
  selectionHelp: [function () {
    return {
      require: '^selection',
      transclude: true,
      link: function (scope, element, attrs, selectionCtrl, transclude) {
        selectionCtrl.$transcludeHelp = transclude;
      }
    }
  }],
  selectionHelpTransclude: [function () {
    return {
      require: '^selection',
      link: function (scope, element, attrs, selectionCtrl) {
        selectionCtrl.$transcludeHelp(function (clone) {
          element.html(clone);
        });
      }
    }
  }],
  sourceSelect: [function () {
    return {
      require: ['ngModel', 'sourceSelect'],
      controller: function (){},
      link: function (scope, element, attrs, controllers) {
        controllers[1].modelCtrl = controllers[0];
      }
    };
  }],
  sourceOption: ['$parse', function ($parse) {
    return {
      require: '^sourceSelect',
      link: function (scope, element, attrs, sourceSelectCtrl) {
        // sourceSelectCtrl.modelCtrl.$setViewValue(sourceSelectCtrl.modelCtrl.$modelValue);
        var value = $parse(attrs.sourceOption)(scope);
        element.bind('click', function () {
          scope.$apply(function () {
            sourceSelectCtrl.modelCtrl.$setViewValue(value);
          });
        });
      }
    };
  }]
});

