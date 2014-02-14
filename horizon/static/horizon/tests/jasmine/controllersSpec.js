/*global describe, it, expect, jasmine, beforeEach, afterEach, spyOn, angular*/
describe('controllers', function () {
  'use strict';

  beforeEach(function () {
    angular.mock.module('hz');
  });

  describe('sidebarCtrl', function () {
    var $scope, JSONCache, sidebarData, currentDashboard;

    beforeEach(function () {
      currentDashboard = {
        "currentDashboard": true,
        "name": "Admin",
        "panelsGroups": [
          {
            "panels": [{ "url": "/admin/", "name": "Overview"}, {"url": "/admin/hypervisors/", "name": "Hypervisors"}, {"url": "/admin/aggregates/", "name": "Host Aggregates"}],
            "currentPanel": 0,
            "name": "System Panel"
          },
          {
            "panels": [{"url": "/admin/projects/", "name": "Projects"}],
            "currentPanel": -1,
            "name": "Identity Panel"
          }]
      };

      sidebarData = [{
        "currentDashboard":  false,
        "name":  "Project",
        "panelsGroups":  [
          {
            "panels":  [{"url":  "/project/", "name":  "Overview"}],
            "currentPanel":  -1,
            "name":  "Manage Compute"
          },
          {
            "panels":  [{"url":  "/project/network_topology/", "name":  "Network Topology"}, {"url":  "/project/networks/", "name":  "Networks"}, {"url":  "/project/routers/", "name":  "Routers"}],
            "currentPanel":  -1,
            "name":  "Manage Network"
          }]
      }, currentDashboard];


      angular.mock.inject(function ($injector) {
        JSONCache = $injector.get('JSONCache');
        JSONCache.put('sidebar', sidebarData);

        $scope = $injector.get('$rootScope').$new();
        $injector.get('$controller')('SidebarCtrl', {$scope:   $scope});

      });
    });

    it('should be provided by JSONCache with sidebar key', function () {
      expect($scope.navs).toEqual(sidebarData);
    });

    it('should only display the panelsGroups of the current dashboard',
      function () {
        expect($scope.panelsGroups).toEqual(currentDashboard.panelsGroups);
      });

    it('should only open the accordion with the current panel', function () {
      var openedPanelsGroup = {}, currentPanel = {};

      //checks that they are correctly different
      expect(openedPanelsGroup).not.toBe(currentPanel);

      angular.forEach($scope.navs, function (nav) {
        angular.forEach(nav.panelsGroups, function (panelsGroup) {
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
      function () {
        expect($scope.panelsGroups).toEqual(currentDashboard.panelsGroups);
        expect($scope.panelsGroups).not.toEqual(sidebarData[0].panelsGroups);
        $scope.active(sidebarData[0]);
        expect($scope.panelsGroups).toEqual(sidebarData[0].panelsGroups);
        expect(sidebarData[0].currentDashboard).toBeTruthy();
        expect(currentDashboard.currentDashboard).toBeFalsy();
      });

    it('should have a configurable variable to open all the accordions',
      angular.mock.inject(function ($injector) {
        var $scope, hzConfig = $injector.get('hzConfig');
        hzConfig.nav_accordion.all_open = true;
        $scope = $injector.get('$rootScope').$new();
        $injector.get('$controller')('SidebarCtrl', {$scope:   $scope});
        angular.forEach($scope.panelsGroups, function (panelsGroup) {
          expect(panelsGroup.isopen).toBeTruthy();
        });
      }));

    it('should have a configurable variable to open only ' +
      'one accordion at a time',
      angular.mock.inject(function ($injector) {
        var $scope, hzConfig = $injector.get('hzConfig');
        hzConfig.nav_accordion.one_at_a_time = true;
        $scope = $injector.get('$rootScope').$new();
        $injector.get('$controller')('SidebarCtrl', {$scope:   $scope});
        expect($scope.oneAtATime).toBeTruthy();
        expect($scope.oneAtATime).toEqual(hzConfig.nav_accordion.one_at_a_time);
      }));

    it('should warn the user if two incompatible options are activated',
      angular.mock.inject(function ($injector) {
        var $log, hzConfig = $injector.get('hzConfig');
        hzConfig.nav_accordion.one_at_a_time = true;
        hzConfig.nav_accordion.all_open = true;
        hzConfig.debug = true;
        $log = $injector.get('$log');
        $injector.get('$controller')(
          'SidebarCtrl',
          {$scope: $injector.get('$rootScope').$new()}
        );
        expect($log.warn.logs.length).toEqual(1);
        expect($log.warn.logs[0][0]).toEqual("all_open and one_at_time are " +
          "not compatible, one_at_a_time will get the priority over all_open");
      }));
  });
});
