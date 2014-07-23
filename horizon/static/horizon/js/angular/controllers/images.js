/*global horizonApp */
horizonApp.controller('imagesCtrl', ['$scope', 'launchWorkflow',
  function ($scope, launchWorkflow) {
    $scope.launch = launchWorkflow.start;
  }]);