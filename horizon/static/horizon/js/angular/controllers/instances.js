/*globals horizonApp, angular, gettext*/
(function () {
  'use strict';
  function image_categories(images, volumes, tenant_id) {
    var persistent = {},
      ephemeral_sources = {
        images: {
          title: gettext('Images'),
          values: [],
          instance_type: 'image_id',
          total: 0
        },
        instances_snapshots: {
          title: gettext('Instances Snapshots'),
          values: [],
          instance_type: 'instance_snapshot_id',
          total: 0
        },
        total: 0
      },
      ephemeral = {
        'project': angular.copy(ephemeral_sources),
        'public': angular.copy(ephemeral_sources),
        'shared': angular.copy(ephemeral_sources)
      };

    ephemeral['public'].title = gettext('Public');
    ephemeral.project.title = gettext('Project');
    ephemeral.shared.title = gettext('Shared with me');

    angular.forEach(images, function (image) {

      function push(image, type) {
        var source_type =
          image.properties.image_type === "snapshot" ?
            'instances_snapshots' : 'images';
        ephemeral[type].total += 1;
        ephemeral[type][source_type].values.push(image);
        ephemeral[type][source_type].total += 1;
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
              var datas = image_categories(
                response.data.images,
                {
                  volumes: response.data.volumes,
                  volumes_snapshots: response.data.volumes_snapshots
                },
                response.data.tenant
              );

              $scope.type = 'ephemeral';
              $scope.datas = datas[$scope.type];

              $scope.$watch('type', function (value) {
                $scope.datas = datas[value];
              });

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
      }])
    .config(['$filterProvider', function ($filterProvider) {
      $filterProvider.register('name', function () {
        return function (obj) {
          return obj.name || obj.display_name || 'Name could not be retrieved';
        };
      });
    }]);
}());
