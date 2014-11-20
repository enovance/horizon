/*globals horizonApp, angular, gettext*/
'use strict';

horizonApp
  .factory('launchHelper', function() {
    function imageCategories(images, volumes) {
      var image_list = [];
      var snapshot_list = [];
      for (i=0; i< images.length; i++) {
        if (images[i].properties.image_type === "snapshot") {
          snapshot_list.push(images[i]);
        } else {
          image_list.push(images[i]);
        }
      }
      return {images:image_list, snapshots:snapshot_list,
              volumes:volumes['volumes'], volumes_snapshots:volumes['volumes_snapshots']};
    }

    return {
      imageCategories: imageCategories,
      sortFlavors: function(f1, f2) {
        //take this opportunity to replace ephemeral crappy key
        f1.ephemeral = f1['OS-FLV-EXT-DATA:ephemeral'];
        f2.ephemeral = f2['OS-FLV-EXT-DATA:ephemeral'];
        return f1.ram > f2.ram;
      }
    };
  })
  .factory('stepFactory', function() {
    function Step() {
      this.active    = false;
      this.showError = false;
      this.valid     = false;
      this.form      = null;
    }

    return function(selectFn, validateFn) {
      var step = new Step();

      step.select = angular.bind(step, selectFn);
      step.validate = angular.bind(step, validateFn);

      return step;
    }
  })
  .factory('launchWorkflow', ['hzMessages', '$modal', '$http', '$animate', '$modalStack',
    function(hzMessages, $modal, $http, $animate, $modalStack) {
      return {
        start: function() {
          //the animate service must be disable because it blocks the modal show
          $animate.enabled(false);

          var modalInstance = $modal.open({
            size: 'lg',
            windowClass: 'launch-instance fullscreen',
            keyboard: false,
            backdrop: 'static',
            templateUrl: '/workflow/launchTemplate',
            resolve: {
              response: function() {
                return $http.get('/workflow/launch');
              }
            },
            controller: 'ModalLaunchInstanceCtrl'
          });

          modalInstance.result.then(function(success) {
            hzMessages.alert(gettext(
              'Instance: "' + success.data.name + '" successfully created'
            ), 'success');
            window.setTimeout(function() {
              location.reload();
            }, 3000);
          }, function(error) {
            if (error === 'cancel') {
              hzMessages.alert(gettext('Launch instance has been aborted'), 'info');
            } else if (error.status && error.status === 401) {
              hzMessages.alert(gettext('You are not logged anymore, disconnecting'), 'error');
              location.reload();
            } else {
              hzMessages.alert(error.data, 'error');
            }
          })['finally'](function() {
            $animate.enabled(true);
          });
        }
      };
    }
  ])
  .controller({
    ModalLaunchInstanceCtrl: ['$scope', '$modalInstance', '$injector', 'response',
      function($scope, $modalInstance, $injector, response) {
        var data = $scope.response = response.data;
        $scope.datas = $injector.get('launchHelper').imageCategories(
          data.images, {
            volumes: data.volumes,
            volumes_snapshots: data.volumes_snapshots
          });
        var steps = $scope.steps = {};
        var stepFactory = $injector.get('stepFactory');

        function select(validateFn) {
          return function() {
            $scope.currentStep.showError = true;
            if (!validateFn()) {
              return false;
            }
            $scope.currentStep = this;
          }
        }

        function validate(previousStep) {
          return function() {
            if (this === $scope.currentStep && this.form) {
              this.valid = this.form.$valid && previousStep.valid;
            }

            return this.valid;
          }
        }

        steps.selectSource = stepFactory(
          function() {
            $scope.currentStep = this;
          }, function() {
            if (this === $scope.currentStep && this.form) {
              this.valid = this.form.$valid;
            }
            return this.valid;
          });

        steps.flavor = stepFactory(
          select(steps.selectSource.validate),
          validate(steps.selectSource)
        );

        steps.access = stepFactory(
          select(steps.flavor.validate),
          validate(steps.flavor)
        );

        steps.advanced = stepFactory(
          select(steps.flavor.validate)
        );

        $scope.currentStep = steps.selectSource;
        $scope.wizard = $injector.get('wizard')('w');

        //initialize launchInstance
        $scope.launchInstance = {
          type: 'ephemeral',
          count: 1,
          availability_zone: $scope.response.zones[0],
          source: {},
          disk_partition: 'AUTO'
        };

        $scope.launch = function() {
          //checks if current form is valid
          if (!$scope.steps.access.validate()) {
            $scope.currentStep.showError = true;
            return;
          }

          $scope.launchInstance.source_type =
            $scope.launchInstance.source.type;

          $scope.launchInstance.source_id = $scope.launchInstance.source.id;

          delete $scope.launchInstance.source;
          $modalInstance.close(
            $injector.get('$http').post('/workflow/launch', angular.toJson($scope.launchInstance))
          );
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };

        $scope.isOnError = function(formField) {
          return formField.$invalid &&
            (formField.$dirty || $scope.currentStep.showError);
        }
      }
    ],

    InstancesCtrl: ['$scope', 'launchWorkflow',
      function($scope, launchWorkflow) {
        $scope.open = launchWorkflow.start;
      }
    ],

    SelectSourceCtrl: ['$scope',
      function($scope) {
        $scope.zones = $scope.response.zones;
        $scope.max_count = $scope.response.count;

        $scope.active = function(valueId) {
          return $scope.SubSelectSourceForm.$valid &&
            $scope.launchInstance.source.id === valueId;
        };

        $scope.next = function() {
          var type = $scope.launchInstance.source.type;
          $scope.launchInstance.volume_size =
            type === 'volumes' || type === 'volumes_snapshots' ?
            $scope.launchInstance.source.size :
            1;
          $scope.wizard.next();
        };

        $scope.$watch('launchInstance.type', function (type) {
          $scope.showBootVolume = type === 'persistent';
          if ($scope.showBootVolume) {
            $scope.launchInstance.device_name = 'vda';
            $scope.launchInstance.volume_size = 1;
          } else {
            delete $scope.launchInstance.device_name;
            delete $scope.launchInstance.volume_size;
          }
          $scope.launchInstance.source.type = "images";
        });

        $scope.$watch('launchInstance.source.type', function (opt) {
          if (opt === 'images') {
            $scope.elts = $scope.datas['images'];
          } else if (opt === 'volumes_snapshots') {
            $scope.elts = $scope.datas['volumes_snapshots'];
          } else if (opt === 'instances_snapshots') {
            $scope.elts = $scope.datas['snapshots'];
          } else if (opt === 'volumes') {
            $scope.elts = $scope.datas['volumes'];
          }
          $scope.image_obj = $scope.elts[0];
        });

        $scope.$watch('image_obj', function (obj) {
          $scope.launchInstance.source.id = obj.id;
          $scope.launchInstance.source.size = obj.size;
        });
      }
    ],

    FlavorCtrl: ['$scope', 'hzQuota', 'launchHelper',
      function($scope, hzQuota, launchHelper) {
        $scope.flavors = $scope.response.flavors.sort(launchHelper.sortFlavors);
        angular.forEach($scope.flavors, function(flavor) {
          hzQuota.flavors[flavor.id] = flavor;
        });
        hzQuota.flavor = $scope.flavors[0].id;
        $scope.vcpusUsed = $scope.response.usages.totalCoresUsed;
        $scope.vcpusQuota = $scope.response.usages.maxTotalCores;
        $scope.ramUsed = $scope.response.usages.totalRAMUsed;
        $scope.ramQuota = $scope.response.usages.maxTotalRAMSize

        $scope.displayFlavor = function(f) {
          hzQuota.flavor = f.id;
        };
      }
    ],

    AccessAndSecurityCtrl: ['$scope', '$modalStack', '$http', 'keypairCreate', 'keypairImport', 'hzMessages',
      function($scope, $modalStack, $http, keypairCreate, keypairImport, hzMessages) {
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

        function keypairHandle(create) {
          $modalStack.getTop().value.modalDomEl.addClass('ng-hide');
          (create ? keypairCreate : keypairImport).open().result.then(
            function(keypair_name) {
              $http.get('/workflow/keypair').then(function(result) {
                $scope.key_pairs = result.data.key_pairs;
                $scope.launchInstance.key_pair_id = keypair_name;
              });
            }, function(error) {
              if (error) {
                hzMessages.alert(error.data, 'error');
              }
            })['finally'](function() {
            $modalStack.getTop().value.modalDomEl.removeClass('ng-hide');
          });
        }

        $scope.createKeypair = function() {
          keypairHandle(true);
        };

        $scope.importKeypair = function() {
          keypairHandle(false);
        }
      }
    ],

    AdvancedOptionCtrl: ['$scope',
      function($scope) {}
    ]
  })
  .filter('name', function() {
    return function(obj) {
      return obj.name || obj.display_name || 'Name could not be retrieved';
    };
  })
  .constant('buttonConfig', {
    activeClass: 'btn-primary'
  });
