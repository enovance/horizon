/*globals horizonApp, angular*/
(function () {
  'use strict';
  horizonApp
    .controller('InstancesCtrl', ['$scope', '$modal',
      function ($scope, $modal) {
        $scope.open = function () {
          var modalInstance = $modal.open({
            windowClass: ['fullscreen'],
            keyboard: false,
            templateUrl: 'InstanceModal.html',
            controller: function ($scope, $modalInstance) {
              $scope.ok = function () {
                $modalInstance.close('ok');
              };

              $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
              };
            }
          });
        };
      }]);
}());
