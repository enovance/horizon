/*globals horizonApp, angular, gettext*/
(function () {
  'use strict';
  function image_categories(images, volumes, tenant_id) {
    var persistent = {},
      ephemeral_sources = {
        source_types: {
          images: {
            title: gettext('Images'),
            values: [],
            total: 0
          },
          instances_snapshots: {
            title: gettext('Instances Snapshots'),
            values: [],
            total: 0
          }
        },
        total: 0
      },
      ephemeral = {
        'project': angular.copy(ephemeral_sources),
        'public': angular.copy(ephemeral_sources),
        'shared': angular.copy(ephemeral_sources)
      };

    ephemeral['public'].title = gettext('Public');
    ephemeral['public'].empty = gettext('No public image available');
    ephemeral.project.title = gettext('Project');
    ephemeral.project.empty = gettext('No project image available');
    ephemeral.shared.title = gettext('Shared with me');
    ephemeral.shared.empty = gettext('No shared image available');

    angular.forEach(images, function (image) {

      function push(image, type) {
        var source_type =
          image.properties.image_type === "snapshot" ? 'instances_snapshots' : 'images';
        ephemeral[type].total += 1;
        ephemeral[type].source_types[source_type].values.push(image);
        ephemeral[type].source_types[source_type].total += 1;
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
      persistent[type].source_types.images.legend = gettext('creates a new volume');
      persistent[type].source_types.instances_snapshots.legend = gettext('creates a new volume');
    });

    persistent.project.source_types.volumes = {
      title: gettext('Volumes'),
      values: volumes.volumes,
      legend: gettext('use this volume'),
      total: volumes.volumes.length
    };

    persistent.project.source_types.volumes_snapshots = {
      title: gettext('Volumes Snapshots'),
      values: volumes.volumes_snapshots,
      legend: gettext('creates a new volume'),
      total: volumes.volumes_snapshots.length
    };

    persistent.project.total += persistent.project.source_types.volumes_snapshots.total +
      persistent.project.source_types.volumes.total;

    //remove empty entries
    angular.forEach(['project', 'public', 'shared'], function (type) {
      angular.forEach(ephemeral[type].source_types, function (source_type, key) {
        if (source_type.total === 0) {
          delete ephemeral[type].source_types[key];
        }
      });
      angular.forEach(persistent[type].source_types, function (source_type, key) {
        if (source_type.total === 0) {
          delete persistent[type].source_types[key];
        }
      });
    });

    return {
      ephemeral: ephemeral,
      persistent: persistent
    };
  }

  function sort_flavors(f1, f2) {
    //take this opportunity to replace ephemeral crappy key
    f1.ephemeral = f1['OS-FLV-EXT-DATA:ephemeral'];
    f2.ephemeral = f2['OS-FLV-EXT-DATA:ephemeral'];
    return f1.ram > f2.ram;
  }

  horizonApp
    .service('launchWorkflow', ['hzConfig', 'hzMessages', '$modal', '$http',
      function (hzConfig, hzMessages, $modal, $http) {
        return {
          start : function () {
            var modalInstance = $modal.open({
              windowClass: 'fullscreen launch-instance',
              keyboard: false,
              backdrop: 'static',
              templateUrl: '/workflow/launchTemplate',
              resolve: {
                response: function () {
                  return $http.get('/workflow/launch');
                }
              },
              controller: 'ModalLaunchInstanceCtrl'
            });

            modalInstance.result.then(function (success) {
              hzMessages.alert(gettext(
                'Instance: "' + success.data.name + '" successfully created'
              ), 'success');
              window.setTimeout(function () {
                location.reload();
              }, 3000);
            }, function (error) {
              if (error === 'cancel') {
                hzMessages.alert(gettext('Launch instance has been aborted'), 'info');
              } else {
                hzMessages.alert(error.data, 'error');
              }
            });
          }
        };
      }])
    .controller({
      ModalLaunchInstanceCtrl: ['$scope', '$modalInstance', '$http', 'response', 'wizard',
        function ($scope, $modalInstance, $http, response, wizard) {
          $scope.response = response.data;
          $scope.datas = image_categories(
            response.data.images,
            {
              volumes: response.data.volumes,
              volumes_snapshots: response.data.volumes_snapshots
            },
            response.data.tenant
          );

          function hasControls(form) {
            var attr;
            for (attr in form) {
              if(form.hasOwnProperty(attr) && attr.charAt(0) !== '$') {
                return true;
              }
            }
            return false;
          }

          $scope.tabs = {
            selectSource : {
              active     : false, 
              valid      : false,
              validate: function () {
                var form = $scope.forms.SelectSourceForm;
                var tab = $scope.tabs.selectSource;

                if (form && hasControls(form)) {
                  tab.valid = form.$valid;
                }
                return tab.valid;
              }
            },
            bootVolume   : {
              active     : false, 
              valid      : false,
              disabled   : true,
              validate   : function () {
                var form = $scope.forms.BootVolumeForm;
                var tab = $scope.tabs.bootVolume;                

                if (form && hasControls(form)) {
                  tab.valid = form.$valid;
                }

                return tab.valid || tab.disabled && 
                  $scope.tabs.selectSource.validate();
              }
            },
            flavor       : {
              active     : false, 
              valid      : false,
              validate   : function () {
                var form = $scope.forms.FlavorForm;
                var tab = $scope.tabs.flavor;                

                if (form && hasControls(form)) {
                  tab.valid = form.$valid;
                }

                return tab.valid && 
                  $scope.tabs.bootVolume.validate();
              }
            },
            access       : {
              valid      : false,
              active     : false, 
              validate : function () {
                var form = $scope.forms.AccessAndSecurityForm;
                var tab = $scope.tabs.access;

                if (form && hasControls(form)) {
                  tab.valid = form.$valid;
                }

                return tab.valid && 
                  $scope.tabs.flavor.validate();
              }
            }
          };
            
          $scope.index = 0;
          $scope.wizard = wizard('w');
          $scope.forms = {};

          //initialize launchInstance
          $scope.launchInstance = {};
          $scope.launchInstance.type = 'ephemeral';
          $scope.launchInstance.count = 1;
          $scope.launchInstance.availability_zone = $scope.response.zones[0];
          $scope.launchInstance.source = {};
          $scope.launchInstance.create_key_pair = false;
          $scope.launchInstance.import_key_pair = false;
          $scope.launchInstance.disk_partition = 'AUTO';

          $scope.launch = function (launchInstanceForm) {
            $scope.launchInstance.source_type = 
              $scope.launchInstance.source.type;
            $scope.launchInstance.source_id = $scope.launchInstance.source.id;

            delete $scope.launchInstance.source;
            $modalInstance.close(
              $http.post('/workflow/launch', angular.toJson($scope.launchInstance))
            );
          };

          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };

          $scope.error = function () {
            $scope.LaunchInstanceForm.$pristine = false;
          }
        }],

      InstancesCtrl: ['$scope', 'launchWorkflow',
        function ($scope, launchWorkflow) {
          $scope.open = launchWorkflow.start;
        }],


      SelectSourceCtrl: ['$scope', function ($scope) {
        $scope.zones = $scope.response.zones;
        $scope.max_count = $scope.response.count;

        $scope.elts = $scope.datas[$scope.type];
        


        $scope.active = function (valueId) {
          return $scope.SubSelectSourceForm.$valid && 
          $scope.launchInstance.source.id === valueId;
        }

        $scope.next = function () {
          var type = $scope.launchInstance.source.type;
          $scope.launchInstance.volume_size = 
            type === 'volumes' || type === 'volumes_snapshots' ? 
            $scope.launchInstance.source.size : 
            1;
          $scope.wizard.next();
        }

        $scope.$watch('launchInstance.type', function () {
          $scope.elts = $scope.datas[$scope.launchInstance.type];
          $scope.$parent.tabs.bootVolume.disabled =
            !($scope.launchInstance.type === 'persistent');
        });

      }],


      BootVolumeCtrl: ['$scope', function ($scope) {
        $scope.launchInstance.device_name = 'vda';
      }],

      FlavorCtrl: ['$scope', function ($scope) {
        $scope.flavors = $scope.response.flavors.sort(sort_flavors);
      }],


      AccessAndSecurityCtrl: ['$scope', function ($scope) {
        $scope.key_pairs = $scope.response.access_security.key_pairs;
        $scope.key_pairs_name = [];
        angular.forEach($scope.key_pairs, function (key_pair) {
          $scope.key_pairs_name.push(key_pair.name);
        });

        $scope.sec_groups_list = $scope.response.access_security.security_groups;
        $scope.networks_list = $scope.response.access_security.available_networks;
        
      }]
    })


    .config(['$filterProvider', function ($filterProvider) {
      $filterProvider.register('name', function () {
        return function (obj) {
          return obj.name || obj.display_name || 'Name could not be retrieved';
        };
      });
    }])
    .constant('buttonConfig', {
      activeClass: 'btn-primary'
    });
}());
