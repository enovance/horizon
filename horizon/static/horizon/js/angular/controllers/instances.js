/*globals horizonApp, angular, gettext*/
(function () {
  'use strict';
  function image_categories(images, volumes, tenant_id) {
    var persistent = {}, ephemeral_sources = {
      images: {
        title: gettext('Images'),
        values: [],
        instance_type: 'image_id'
      },
      instances_snapshots: {
        title: gettext('Instances Snapshots'),
        values: [],
        instance_type: 'instance_snapshot_id'
      }
    }, ephemeral = {
      'project': ephemeral_sources,
      'public': ephemeral_sources,
      'shared': ephemeral_sources
    };
    angular.forEach(images, function (image) {

      function push(image, type) {
        var is_snapshot = image.properties.image_type === "snapshot";
        ephemeral[type][is_snapshot ? 'instances_snapshots' : 'images']
          .values.push(image);
      }

      if (image.is_public) { push(image, 'public'); }
      if (image.owner === tenant_id) {
        push(image, 'project');
      } else if (!image.is_public) {
        push(image, 'shared');
      }
    });

    angular.copy(ephemeral, persistent);
    angular.forEach(['public', 'project', 'shared'], function (type) {
      persistent[type].images.legend = gettext('creates a new volume');
      persistent[type].instances_snapshots.legend = gettext('creates a new volume');
    });

    persistent.project.volumes = {
      title: gettext('Volumes'),
      values: volumes.volumes,
      instance_type: 'volume_id',
      legend: gettext('use this volume')
    };

    persistent.project.volumes_snapshots = {
      title: gettext('Volumes'),
      values: volumes.volumes_snapshots,
      instance_type: 'volume_id',
      legend: gettext('use this volume')
    };
    return {
      ephemeral: ephemeral,
      persistent: persistent
    };
  }


  horizonApp
    .controller('InstancesCtrl', ['$scope', '$modal', '$http', 'hzMessages', 'hzConfig',
      function ($scope, $modal, $http, hzMessages, hzConfig) {
        $scope.open = function () {




          var modalInstance = $modal.open({
            windowClass: ['fullscreen'],
            keyboard: false,
            templateUrl: hzConfig.static_url + '/dashboard/html/launch_instance.html',
            resolve: {
              response: function () {
                return $http.get('launch');
              }
            },
            controller: function ($scope, $modalInstance, response) {
              var elts = image_categories(
                response.data.images,
                {
                  volumes: response.data.volumes,
                  volumes_snapshots: response.data.volumes_snapshots
                },
                response.data.tenant
              );

              $scope.ok = function () {
                $modalInstance.close('ok');
              };

              $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
              };
            }
          });



          modalInstance.result.then(function () {


            console.log('success');



          }, function (error) {
            if (error === 'cancel') {
              console.log(error);
            } else if (error.status && error.status === 500) {
              hzMessages.alert(gettext('An error occurs server side'), 'error');
            }
          });
        };
      }]);
}());
