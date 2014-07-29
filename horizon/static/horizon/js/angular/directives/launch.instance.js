/*globals angular */
angular.module('hz').directive({
  selection: [function () {

    return {
      restrict: 'A',
      require: ['selection', 'ngModel' ],
      transclude: true,
      scope: {
        availables: '=elts',
        id: '@'
      },
      controller: function () {},
      template:
          '<div id="{$ id $}" class="selection">\n' +
          '  <label for="selected_{$ id $}">Selected {$ label $}</label>\n' +
          '  <ul id="selected_{$ id $}" class="selected">\n' +
          '    <li ng-if="!selected.length"><div class="alert alert-info" >No {$ id $} selected. Please add a {$ id $} from the list below</div></li>\n' +
          '    <li ng-repeat="s in selected"><div data-selection-element data-elt="s"></div></li>\n' +
          '  </ul>\n' +
          '  <label for="available_{$ id $}">Available {$ label $}</label>\n' +
          '  <ul id="available_{$ id $}" class="available">\n' +
          '    <li ng-repeat="a in availables"><div data-selection-element data-elt="a"></div></li>\n' +
          '  </ul>\n' +
          '</div>',
      link: function (scope, element, attrs, controllers, transclude) {
        var selectionCtrl = controllers[0];
        var modelCtrl = controllers[1];

        scope.selected = [];

        selectionCtrl.toggle = function (elt) {
          var index = scope.availables.indexOf(elt);
          if (index !== -1) {
            scope.selected.push(elt);
            scope.availables.splice(index, 1);
          } else {
            index = scope.selected.indexOf(elt);
            scope.selected.splice(index, 1);
            scope.availables.push(elt);
          }
          modelCtrl.$setViewValue(scope.selected);
        }

        scope.$transcludeFn = transclude;
      }
    };
  }],
  selectionElement: [function () {
    return {
      require: '^selection',
      replace: true,
      link: function (scope, element, attrs, selectionCtrl) {
        var isolated = scope.$new(true);
        isolated.elt = scope.$eval(attrs.elt);

        scope.$transcludeFn(isolated, function (clone) {
          element.append(clone);
        });

        element.bind('click', function () {
          scope.$apply(function () {
            selectionCtrl.toggle(isolated.elt);
          });
        });
      }
    };
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

