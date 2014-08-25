(function () {
  'use strict';

  angular
    .module('hz.quota', ['hz.d3', 'hz.utils'])
    .service('hzQuota', function () {
      this.count = 0;
      this.flavor = 0;
      this.image = 0;
      this.flavors = {};
      this.images = {};
    })
    .directive({
      hzFlavorDetails: ['hzQuota', function (hzQuota) {
        return {
          scope: {},
          templateUrl: 'template/quota/flavor-details.html',
          link: function (scope) {
            scope.quota = hzQuota;
            scope.$watch('quota.flavor', function (flavorId) {
              scope.flavor = hzQuota.flavors[flavorId];
            });
          }
        }
      }],
      hzQuota: ['hzQuota', function (hzQuota) {
        return {
          scope: {
            vcpusUsed: '@',
            vcpusQuota: '@',
            ramUsed: '@',
            ramQuota: '@'
          },
          templateUrl: 'template/quota/quota.html',
          link: function (scope) {
            scope.quota = hzQuota;
            scope.$watch('quota.flavor', function (flavorId) {
              scope.vcpusAdded = hzQuota.flavors[flavorId].vcpus;
              scope.ramAdded = hzQuota.flavors[flavorId].ram;
            });

          }
        }
      }],
      hzQuotaBar: [function () {
        return {
          templateUrl: 'template/quota/quota-bar.html',
          scope: {
            title: '@',
            used: '@',
            limit: '@',
            added: '='
          }
        }
      }]
    });
}());