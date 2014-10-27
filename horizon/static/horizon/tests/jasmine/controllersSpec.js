/*global describe, it, expect, jasmine, beforeEach, afterEach, spyOn, angular*/
describe('controllers', function() {
  'use strict';

  beforeEach(function() {
    angular.mock.module('hz');
  });

  describe('sidebarCtrl', function() {
    var $scope, JSONCache, sidebarData, currentDashboard;

    beforeEach(function() {
      currentDashboard = {
        "currentDashboard": true,
        "name": "Admin",
        "panelsGroups": [{
          "panels": [{
            "url": "/admin/",
            "name": "Overview"
          }, {
            "url": "/admin/hypervisors/",
            "name": "Hypervisors"
          }, {
            "url": "/admin/aggregates/",
            "name": "Host Aggregates"
          }],
          "currentPanel": 0,
          "name": "System Panel"
        }, {
          "panels": [{
            "url": "/admin/projects/",
            "name": "Projects"
          }],
          "currentPanel": -1,
          "name": "Identity Panel"
        }]
      };

      sidebarData = [{
          "currentDashboard": false,
          "name": "Project",
          "panelsGroups": [{
            "panels": [{
              "url": "/project/",
              "name": "Overview"
            }],
            "currentPanel": -1,
            "name": "Manage Compute"
          }, {
            "panels": [{
              "url": "/project/network_topology/",
              "name": "Network Topology"
            }, {
              "url": "/project/networks/",
              "name": "Networks"
            }, {
              "url": "/project/routers/",
              "name": "Routers"
            }],
            "currentPanel": -1,
            "name": "Manage Network"
          }]
        },
        currentDashboard
      ];


      angular.mock.inject(function($injector) {
        JSONCache = $injector.get('JSONCache');
        JSONCache.put('sidebar', sidebarData);

        $scope = $injector.get('$rootScope').$new();
        $injector.get('$controller')('SidebarCtrl', {
          $scope: $scope
        });

      });
    });

    it('should be provided by JSONCache with sidebar key', function() {
      expect($scope.navs).toEqual(sidebarData);
    });

    it('should only display the panelsGroups of the current dashboard',
      function() {
        expect($scope.panelsGroups).toEqual(currentDashboard.panelsGroups);
      });

    it('should only open the accordion with the current panel', function() {
      var openedPanelsGroup = {},
        currentPanel = {};

      //checks that they are correctly different
      expect(openedPanelsGroup).not.toBe(currentPanel);

      angular.forEach($scope.navs, function(nav) {
        angular.forEach(nav.panelsGroups, function(panelsGroup) {
          if (panelsGroup.currentPanel > -1) {
            currentPanel = panelsGroup;
          }
          if (panelsGroup.isopen) {
            openedPanelsGroup = panelsGroup;
          }
        });
      });
      expect(openedPanelsGroup).toBe(currentPanel);
    });

    it('should provide a function allowing the user to change the current ' +
      'dashboard',
      function() {
        expect($scope.panelsGroups).toEqual(currentDashboard.panelsGroups);
        expect($scope.panelsGroups).not.toEqual(sidebarData[0].panelsGroups);
        $scope.active(sidebarData[0]);
        expect($scope.panelsGroups).toEqual(sidebarData[0].panelsGroups);
        expect(sidebarData[0].currentDashboard).toBeTruthy();
        expect(currentDashboard.currentDashboard).toBeFalsy();
      });

    it('should have a configurable variable to open all the accordions',
      angular.mock.inject(function($injector) {
        var $scope, hzConfig = $injector.get('hzConfig');
        hzConfig.nav_accordion.all_open = true;
        $scope = $injector.get('$rootScope').$new();
        $injector.get('$controller')('SidebarCtrl', {
          $scope: $scope
        });
        angular.forEach($scope.panelsGroups, function(panelsGroup) {
          expect(panelsGroup.isopen).toBeTruthy();
        });
      }));

    it('should have a configurable variable to open only ' +
      'one accordion at a time',
      angular.mock.inject(function($injector) {
        var $scope, hzConfig = $injector.get('hzConfig');
        hzConfig.nav_accordion.one_at_a_time = true;
        $scope = $injector.get('$rootScope').$new();
        $injector.get('$controller')('SidebarCtrl', {
          $scope: $scope
        });
        expect($scope.oneAtATime).toBeTruthy();
        expect($scope.oneAtATime).toEqual(hzConfig.nav_accordion.one_at_a_time);
      }));

    it('should warn the user if two incompatible options are activated',
      angular.mock.inject(function($injector) {
        var $log, hzConfig = $injector.get('hzConfig');
        hzConfig.nav_accordion.one_at_a_time = true;
        hzConfig.nav_accordion.all_open = true;
        hzConfig.debug = true;
        $log = $injector.get('$log');
        $injector.get('$controller')(
          'SidebarCtrl', {
            $scope: $injector.get('$rootScope').$new()
          }
        );
        expect($log.warn.logs.length).toEqual(1);
        expect($log.warn.logs[0][0]).toEqual("all_open and one_at_time are " +
          "not compatible, one_at_a_time will get the priority over all_open");
      }));
  });

  describe('ModalLaunchInstanceCtrl', function() {
    var $scope, $compile;
    var response = {
      "data": {
        "count": 10,
        "zones": ["nova"],
        "volumes_snapshots": [],
        "access_security": {
          "available_networks": [{
            "id": "network1ID",
            "name": "network1"
          }],
          "security_groups": ["default"],
          "key_pairs": []
        },
        "volumes": [],
        "images": [{
          "name": "myImage",
          "updated_at": "2014-10-08T08:29:34",
          "id": "imageID",
          "min_disk": 0,
          "min_ram": 0,
          "checksum": "",
          "owner": "",
          "is_public": true,
          "properties": {},
          "size": 25165824
        }],
        "usages": {
          "totalRAMUsed": 0,
          "totalCoresUsed": 0,
          "maxTotalRAMSize": 51200,
          "maxTotalCores": 20
        },
        "tenant": "tenantTest",
        "flavors": [{
          "name": "m1.tiny",
          "links": [],
          "ram": 512,
          "OS-FLV-DISABLED:disabled": false,
          "vcpus": 1,
          "swap": "",
          "os-flavor-access:is_public": true,
          "rxtx_factor": 1,
          "OS-FLV-EXT-DATA:ephemeral": 0,
          "disk": 1,
          "id": "1"
        }]
      },
      "status": 200
    };


    beforeEach(angular.mock.inject(function($injector) {
      $scope = $injector.get('$rootScope').$new();
      $compile = $injector.get('$compile');

      $injector.get('$controller')('ModalLaunchInstanceCtrl', {
        $scope: $scope,
        $modalInstance: {}, // mock for modal instance has to be created
        $injector: $injector,
        response: response
      });
    }));

    it('should have an object in which launchInstance properties are saved',
      function() {
        expect($scope.launchInstance).toBeDefined();
        expect($scope.launchInstance.type).toEqual('ephemeral');
        expect($scope.launchInstance.count).toEqual(1);
        expect($scope.launchInstance.availability_zone)
          .toEqual(response.data.zones[0]);
        expect($scope.launchInstance.source).toEqual({});
        expect($scope.launchInstance.disk_partition).toEqual('AUTO');
      });

    it('should have a function, which checks if the specified field need an ' +
      'error message', function () {
        function helper(showError, $invalid, $dirty) {
          $scope.currentStep = {
            showError: showError
          };

          var formField = {
            $invalid: $invalid,
            $dirty: $dirty
          }
          return $scope.isOnError(formField);
        }

        /*
         *                        Truth table
         *                        ===========
         *|-------------------|------------------|----------------|
         *|     showError     |     $invalid     |     $dirty     |
         *|-------------------|------------------|----------------|
         *|         0         |         0        |       0        |
         *|         1         |         0        |       0        |
         *|         0         |         1        |       0        |
         *|         1         |         1        |       0        |
         *|         0         |         0        |       1        |
         *|         1         |         0        |       1        |
         *|         0         |         1        |       1        |
         *|         1         |         1        |       1        |
         *|-------------------|------------------|----------------|
         */
        expect(helper(false, false, false)).toBeFalsy();
        expect(helper(true, false, false)).toBeFalsy();

        expect(helper(false, true, false)).toBeFalsy();
        expect(helper(true, true, false)).toBeTruthy();

        expect(helper(false, false, true)).toBeFalsy();
        expect(helper(true, false, true)).toBeFalsy();

        expect(helper(false, true, true)).toBeTruthy();
        expect(helper(true, true, true)).toBeTruthy();
      });

    it('should set up error when on flavor selection, if no flavor is selected',
      function() {
        var template = [
          '<div ng-form="steps.flavor.form" class="row-fluid">',
          '  <input ng-model="launchInstance.flavor" name="flavor" required>',
          '</div>'
        ].join('\n');

        $compile(template)($scope);
        $scope.$digest();

        /*
         Set up the step as current
         (otherwise validate will not evaluate the form)
         and define the previous step as valid
        */
        $scope.currentStep = $scope.steps.flavor;
        $scope.steps.selectSource.valid = true;

        expect($scope.steps.flavor.form).toBeDefined();
        expect($scope.steps.flavor.valid).toBeFalsy();
        expect($scope.steps.flavor.showError).toBeFalsy();

        // execute the validate function
        $scope.steps.flavor.select();
        expect($scope.steps.flavor.valid).toBeFalsy();
        expect($scope.steps.flavor.showError).toBeTruthy();

        // fulfill the flavor model
        $scope.launchInstance.flavor = "someFlavor";
        // propagate the change
        $scope.$digest();

        $scope.steps.flavor.validate();
        expect($scope.steps.flavor.valid).toBeTruthy();
        // after one mistake we continue to display any error
        $scope.steps.flavor.select();
        expect($scope.steps.flavor.showError).toBeTruthy();
      });
  });
});
