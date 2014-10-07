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
        '0_public': angular.copy(ephemeral_sources),
        '1_project': angular.copy(ephemeral_sources),
        '2_shared': angular.copy(ephemeral_sources)
      };

    ephemeral['0_public'].title = gettext('Public');
    ephemeral['0_public'].empty = gettext('No public image available');
    ephemeral['1_project'].title = gettext('Project');
    ephemeral['1_project'].empty = gettext('No project image available');
    ephemeral['2_shared'].title = gettext('Shared with me');
    ephemeral['2_shared'].empty = gettext('No shared image available');

    angular.forEach(images, function (image) {

      function push(image, type) {
        var source_type =
          image.properties.image_type === "snapshot" ? 'instances_snapshots' : 'images';
        ephemeral[type].total += 1;
        ephemeral[type].source_types[source_type].values.push(image);
        ephemeral[type].source_types[source_type].total += 1;
      }

      if (image.is_public) { push(image, '0_public'); }
      if (image.owner === tenant_id) {
        push(image, '1_project');
      } else if (!image.is_public) {
        push(image, '2_shared');
      }
    });

    angular.copy(ephemeral, persistent);
    angular.forEach(['0_public', '1_project', '2_shared'], function (type) {
      persistent[type].source_types.images.legend = gettext('creates a new volume');
      persistent[type].source_types.instances_snapshots.legend = gettext('creates a new volume');
    });

    persistent['1_project'].source_types.volumes = {
      title: gettext('Volumes'),
      values: volumes.volumes,
      legend: gettext('use this volume'),
      total: volumes.volumes.length
    };

    persistent['1_project'].source_types.volumes_snapshots = {
      title: gettext('Volumes Snapshots'),
      values: volumes.volumes_snapshots,
      legend: gettext('creates a new volume'),
      total: volumes.volumes_snapshots.length
    };

    persistent['1_project'].total += persistent['1_project'].source_types.volumes_snapshots.total +
      persistent['1_project'].source_types.volumes.total;

    //remove empty entries
    angular.forEach(['1_project', '0_public', '2_shared'], function (type) {
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
              } else if (error.status && error.status === 401) {
                hzMessages.alert(gettext('You are not logged anymore, disconnecting'), 'error');
                location.reload();
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

          $scope.showError = function () {
            angular.forEach($scope.forms, function (form) {
              if (angular.isDefined(form)) {
                form.showError = true;
              }
            });
            return true;
          };

          function hasControls(form) {
            function isControl (attr) {
              return attr.charAt(0) !== '$' && attr !== 'showError';
            }

            var attr;
            for (attr in form) {
              if (form.hasOwnProperty(attr) && isControl(attr)) {
                return true;
              }
            }
            return false;
          }

          $scope.tabs = {
            selectSource : {
              active   : false,
              valid    : false,
              validate : function () {
                var form = $scope.forms.SelectSourceForm;
                var tab = $scope.tabs.selectSource;

                if (form && hasControls(form)) {
                  tab.valid = form.$valid;
                }
                $scope.showError();
                return tab.valid;
              }
            },
            bootVolume : {
              active   : false,
              valid    : false,
              disabled : true,
              validate : function () {
                var form = $scope.forms.BootVolumeForm;
                var tab = $scope.tabs.bootVolume;

                if (form && hasControls(form)) {
                  tab.valid = form.$valid;
                }
                $scope.showError();
                return tab.valid || tab.disabled &&
                  $scope.tabs.selectSource.validate();
              }
            },
            flavor : {
              active   : false,
              valid    : false,
              validate : function () {
                var form = $scope.forms.FlavorForm;
                var tab = $scope.tabs.flavor;

                if (form && hasControls(form)) {
                  tab.valid = form.$valid;
                }
                $scope.showError();
                return tab.valid &&
                  $scope.tabs.bootVolume.validate();
              }
            },
            access : {
              valid    : false,
              active   : false,
              validate : function () {
                var form = $scope.forms.AccessAndSecurityForm;
                var tab = $scope.tabs.access;

                if (form && hasControls(form)) {
                  tab.valid = form.$valid;
                }
                return tab.valid &&
                  $scope.tabs.flavor.validate();
              }
            },
            advanced    : {
              active    : false
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
          $scope.launchInstance.disk_partition = 'AUTO';

          $scope.launch = function () {
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
          $scope.isFirst = function () {
            var ctrl = $scope.wizard.wizardController();
            return (ctrl.step.index == 0);
          };
          $scope.isLast = function () {
            var ctrl = $scope.wizard.wizardController();
            return (ctrl.step.index == (ctrl.steps.length - 1));
          };

          $scope.isOnError = function (formField, form) {
            return formField.$invalid &&
            (formField.$dirty || form.showError);
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
        };

        $scope.next = function () {
          var type = $scope.launchInstance.source.type;
          $scope.launchInstance.volume_size =
            type === 'volumes' || type === 'volumes_snapshots' ?
            $scope.launchInstance.source.size :
            1;
          $scope.wizard.next();
        };

        $scope.$watch('launchInstance.type', function () {
          $scope.elts = $scope.datas[$scope.launchInstance.type];
          $scope.$parent.tabs.bootVolume.disabled =
            !($scope.launchInstance.type === 'persistent');
        });

      }],


      BootVolumeCtrl: ['$scope', function ($scope) {
        $scope.launchInstance.device_name = 'vda';
      }],

      FlavorCtrl: ['$scope', 'hzQuota', function ($scope, hzQuota) {
        $scope.flavors = $scope.response.flavors.sort(sort_flavors);
        angular.forEach($scope.flavors, function (flavor) {
          hzQuota.flavors[flavor.id] = flavor;
        });
        hzQuota.flavor = $scope.flavors[0].id;
        $scope.vcpusUsed = $scope.response.usages.totalCoresUsed;
        $scope.vcpusQuota = $scope.response.usages.maxTotalCores;
        $scope.ramUsed = $scope.response.usages.totalRAMUsed;
        $scope.ramQuota = $scope.response.usages.maxTotalRAMSize

        $scope.displayFlavor = function (f) {
          hzQuota.flavor = f.id;
        };
      }],


      AccessAndSecurityCtrl: ['$scope', '$modalStack', '$http', 'keypairCreate', 'keypairImport', 'hzMessages',
      function ($scope, $modalStack, $http, keypairCreate, keypairImport, hzMessages) {
        $scope.key_pairs = $scope.response.access_security.key_pairs;
        $scope.sec_groups_list = $scope.response.access_security.security_groups;
        $scope.networks_list = $scope.response.access_security.available_networks;

        if ($scope.key_pairs.length == 1) {
          $scope.launchInstance.key_pair_id = $scope.key_pairs[0].name;
        }
        if ($scope.sec_groups_list.length == 1) {
          $scope.launchInstance.sec_groups = [$scope.sec_groups_list[0]];
          $scope.sec_groups_list = [];
        }
        if ($scope.networks_list.length == 1) {
          $scope.launchInstance.networks = [$scope.networks_list[0]];
          $scope.networks_list = [];
        }

        function keypairHandle (create) {
          $modalStack.getTop().value.modalDomEl.addClass('ng-hide');
          (create ? keypairCreate : keypairImport).open().result.then(
            function (keypair_name) {
              $http.get('/workflow/keypair').then(function (result) {
                $scope.key_pairs = result.data.key_pairs;
                $scope.launchInstance.key_pair_id = keypair_name;
              });
            }, function (error) {
              if (error) {
                hzMessages.alert(error.data, 'error');
              }
            })['finally'](function () {
              $modalStack.getTop().value.modalDomEl.removeClass('ng-hide');
            });
        }

        $scope.createKeypair = function () {
          keypairHandle(true);
        };

        $scope.importKeypair = function () {
          keypairHandle(false);
        }
      }],

       AdvancedOptionCtrl: ['$scope', function ($scope) {
      }]
    })
    .filter('name', function () {
      return function (obj) {
        return obj.name || obj.display_name || 'Name could not be retrieved';
      };
    })
    .constant('buttonConfig', {
      activeClass: 'btn-primary'
    });
}());
