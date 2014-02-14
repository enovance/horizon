/*globals angular */
angular.module('hz').directive({
  selection: [function () {

    return {
      restrict: 'A',
      require: 'ngModel',
      transclude: true,
      scope: {
        availables: '=elts',
        id: '@'
      },
      controller: ['$scope', function ($scope) {

        this.toggle = function (elt) {

          var index = $scope.availables.indexOf(elt);
          if (index !== -1) {
            $scope.selected.push(elt);
            $scope.availables.splice(index, 1);
          } else {
            index = $scope.selected.indexOf(elt);
            $scope.selected.splice(index, 1);
            $scope.availables.push(elt);
          }
          $scope.modelCtrl.$setViewValue($scope.selected);
        };
      }],
      template:
          '<div id="{$ id $}" class="selection">\n' +
          '  <label for="selected_{$ id $}">Selected {$ label $}</label>\n' +
          '  <ul id="selected_{$ id $}" class="selected">' +
          '    <li ng-repeat="s in selected"><div data-selection-element data-elt="s"></div></li>\n' +
          '  </ul>\n' +
          '  <label for="available_{$ id $}">Available {$ label $}</label>\n' +
          '  <ul id="available_{$ id $}" class="available">\n' +
          '    <li ng-repeat="a in availables"><div data-selection-element data-elt="a"></div></li>\n' +
          '  </ul>\n' +
          '</div>',
      link: function (scope, element, attrs, modelCtrl, transclude) {
        scope.modelCtrl = modelCtrl;
        scope.selected = [];
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
  }]
});

