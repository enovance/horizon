/*globals horizonApp, angular*/
(function () {
  'use strict';
  horizonApp
    .controller('SidebarCtrl', ['$scope', 'JSONCache', 'hzConfig', 'hzUtils',
      function ($scope, JSONCache, hzConfig, hzUtils) {

        if (hzConfig.nav_accordion.all_open &&
            hzConfig.nav_accordion.one_at_a_time) {
          hzUtils.log('all_open and one_at_time are not compatible, ' +
            'one_at_a_time will get the priority over all_open', 'warn');
        }

        $scope.navs = JSONCache.get('sidebar');
        $scope.oneAtATime = hzConfig.nav_accordion.one_at_a_time;

        angular.forEach($scope.navs, function (nav) {
          if (nav.currentDashboard) {
            $scope.panelsGroups = nav.panelsGroups;
          }
          angular.forEach(nav.panelsGroups, function (panelsGroup) {
            panelsGroup.isopen = hzConfig.nav_accordion.all_open ||
              panelsGroup.currentPanel > -1;
          });
        });

        $scope.active = function (nav) {
          angular.forEach($scope.navs, function (nav) {
            nav.currentDashboard = false;
          });
          nav.currentDashboard = true;
          $scope.panelsGroups = nav.panelsGroups;
        };

      }]);
}());
