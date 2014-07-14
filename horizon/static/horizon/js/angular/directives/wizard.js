/*global angular*/
'use strict';

angular
.module('ui.widget.wizard', ['ui.widget.tpls'])
.service('wizard', ['$timeout', '$q', function($timeout, $q){
  var wizards = {};

  function Wizard(id) {
    var d = $q.defer();

    $timeout(function () {
      d.resolve(wizards[id]);
    });

    function move(index, step, wizard) {
      while (-1 < index && index < wizard.steps.length && wizard.steps[index].disabled) {
        index += step;
      }
      if (-1 < index && index < wizard.steps.length) {
        wizard.select(index);
      }
    }

    this.next = function() {
      d.promise.then(function (wizard) {
        move(wizard.step.index + 1, 1, wizard);
      });
    };

    this.previous = function() {
      d.promise.then(function (wizard) {
        move(wizard.step.index - 1, -1, wizard);
      });
    };

    this.first = function() {
      d.promise.then(function (wizard) {
        move(0, 1, wizard);
      });
    };

    this.last = function () {
      d.promise.then(function (wizard) {
        move(wizard.steps.length -1, -1, wizard);
      });
    };
  }

  this.register = function (id, wizard) {
    wizards[id] = wizard;
  };

  this.get = function (id) {
    return new Wizard(id);
  };
}])
.controller('WizardController', ['$scope', 'wizard', '$timeout',
  function($scope, wizard, $timeout) {
    var ctrl = this,
    steps = ctrl.steps = $scope.steps = [],
    step = ctrl.step = {
      scope: {active: null, onDeselect: angular.noop},
      index: null
    };

    wizard.register($scope.name, this);

    ctrl.select = function(selectedStep) {
      var index;
      if (typeof selectedStep === "number") {
        index = selectedStep;
        selectedStep = steps[index];
      } else {
        index = steps.indexOf(selectedStep);
      }

      if(selectedStep.onSelect()) {
        step.scope.active = false;
        step.scope.onDeselect();
        step.index = index;

        step.scope = selectedStep;
        step.scope.active = true;
      }
    };


    $timeout(function () {
      var s;
      angular.forEach(steps, function (step) {
        if(step.active) { s = step; }
      });
      ctrl.select(s || 0);
    });
  }])
.directive('wizard', function () {
  return {
    restrict: 'EA',
    transclude: true,
    replace: true,
    scope: {
      name: '@'
    },
    controller: 'WizardController',
    templateUrl: 'template/wizard/wizard.html',
    link: function (scope, elm, attrs) {
      if ( !attrs.first) {
        scope.onFirst = function () { return true; };
      }

      if ( !attrs.last ) {
        scope.onLast = function () { return true; };
      }
    }
  };
})
.directive('step', ['$parse',
  function($parse) {
    return {
      require: '^wizard',
      restrict: 'EA',
      replace: true,
      templateUrl: 'template/wizard/step.html',
      transclude: true,
      scope: {
        heading: '@',
        onSelect: '&select', //This callback is called in
        //contentHeadingTransclude once it inserts the step's content
        //into the dom
        onDeselect: '&deselect'
      },
      controller: function() {
        //Empty controller so other directives can require being 'under' a step
      },
      link: function(scope, elm, attrs, wizardCtrl, transclude) {
        var setActive = $parse(attrs.active).assign || angular.noop;
        scope.active = !!$parse(attrs.active)();

        scope.$watch('active', function(active) {
          setActive(scope.$parent, active);
        });

        if ( !attrs.select ) {
          scope.onSelect = function () { return true; };
        }

        scope.disabled = false;
        if ( attrs.disabled ) {
          scope.$parent.$watch($parse(attrs.disabled), function(value) {
            scope.disabled = !! value;
          });
        }

        scope.select = function () {
          wizardCtrl.select(scope);
        };

        wizardCtrl.steps.splice(
          Array.prototype.indexOf.call(elm.parent().children(), elm[0]),
          0, scope
        );

        scope.$on('$destroy', function() {
          wizardCtrl.removeStep(scope);
        });
        //We need to transclude later, once the content container is ready.
        //when this link happens, we're inside a step heading.
        scope.$transcludeFn = transclude;
      }
    };
  }])

.directive('stepHeadingTransclude', [
  function() {
    return {
      restrict: 'A',
      require: '^step',
      link: function(scope, elm, attrs, stepCtrl) {
        scope.$watch('headingElement', function updateHeadingElement(heading) {
          if (heading) {
            elm.html('');
            elm.append(heading);
          }
        });
      }
    };
  }])

.directive('stepContentTransclude', function() {
  return {
    restrict: 'A',
    require: '^wizard',
    link: function(scope, elm, attrs) {
      var step = scope.$eval(attrs.stepContentTransclude);
      //Now our step is ready to be transcluded: both the step heading area
      //and the step content area are loaded.  Transclude 'em both.
      step.$transcludeFn(step.$parent, function(contents) {
        angular.forEach(contents, function(node) {
          if (isStepHeading(node)) {
            //Let stepHeadingTransclude know.
            step.headingElement = node;
          } else {
            elm.append(node);
          }
        });
      });
    }
  };

  function isStepHeading(node) {
    return node.tagName && (
      node.hasAttribute('step-heading') ||
      node.hasAttribute('data-step-heading') ||
      node.tagName.toLowerCase() === 'step-heading' ||
      node.tagName.toLowerCase() === 'data-step-heading'
      );
  }
});

angular.module('ui.widget.tpls', ['template/wizard/step.html','template/wizard/wizard.html']);
angular.module('template/wizard/step.html', []).run(['$templateCache', function($templateCache) {
  $templateCache.put('template/wizard/step.html',
    '<li ng-class="{active: active, disabled: disabled}" class="step"><a ng-click="select()" step-heading-transclude="">{{heading}}</a></li>');
}]);

angular.module('template/wizard/wizard.html', []).run(['$templateCache', function($templateCache) {
  $templateCache.put('template/wizard/wizard.html',
    '<div class="wizard"><ul class="wizard-steps nav nav-tabs" ng-transclude=""></ul><div class="wizard-content tab-content"><div class="step-pane tab-pane" ng-repeat="step in steps" ng-class="{active: step.active}" step-content-transclude="step"></div></div></div>');
}]);