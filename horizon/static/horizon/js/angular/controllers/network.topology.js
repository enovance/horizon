/*global horizonApp */
horizonApp.controller('networkTopologyCtrl', ['$scope', 'launchWorkflow',
  function ($scope, launchWorkflow) {
    $scope.launch = launchWorkflow.start;
  }]);