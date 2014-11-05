/*global describe, it, expect, jasmine, beforeEach, afterEach, spyOn, angular*/
describe('controllers', function() {
  'use strict';

  beforeEach(function() {
    angular.mock.module('hz');
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
