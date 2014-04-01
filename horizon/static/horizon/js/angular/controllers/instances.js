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
            template: '<div class="modal-header">' +
              '<h3>I\'m a modal!</h3>' +
              '</div>' +
              '<div class="modal-body">' +
              '<tabset class="wizard">' +
              '<tab>' +
              '<tab-heading>' +
              '<i class="glyphicon glyphicon-bell"></i> Alert!' +
              '</tab-heading>' +
              '<div style="height: 200px">' +
              '</div></tab>' +
              '<tab heading="Vertical 2">Vertical content 2</tab>' +
              '</tabset>' +
              '</div>' +
              '<div class="modal-footer">' +
              '<button class="btn btn-primary" ng-click="ok()">OK</button>' +
              '<button class="btn btn-warning" ng-click="cancel()">Cancel</button>' +
              '</div>',
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
