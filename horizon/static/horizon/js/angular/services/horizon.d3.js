(function () {
  'use strict';

  function hzD3Bar(d3, config) {
    return {
      scope: {
        used: '@',
        limit: '@',
        added: '='
      },
      link: function (scope, elt, attrs) {
        var barHeight = parseInt(attrs.barHeight) || 20;
        var bar, added, used = scope.used;

        function addRect(width, color) {
          return bar.append('rect')
            .attr('width', width)
            .attr('height', barHeight)
            .style('fill', color);
        }

        bar = d3.select(elt[0])
          .append('svg')
          .attr('width', '100%')
          .style('height', barHeight)
          .append('g');

        var xScale = d3.scale.linear()
          .domain([0, scope.limit])
          .range([0, elt.prop('offsetWidth')]);

        var percentScale = d3.scale.linear()
          .domain([0, scope.limit])
          .range([0, 100]);

        addRect('100%', config.bg)
          .style('stroke', config.border)
          .style('stroke-width', 2);

        addRect(0, config.fg)
          .transition()
          .duration(config.transition)
          .attr('width', xScale(used))
          .style('fill', function () {
            var percentage = percentScale(used);
            if (percentage >= 100) { return config.full; }
            else if (percentage >= 80) { return config.nearlyfull; }
            else { return config.fg; }
          })
          .each('end', function () {
            added = addRect(0, config.addition)
              .attr('transform', 'translate(' + xScale(used) + ')');
            render();
          });

        scope.$watch('added', function () {
          if (added) {
            render();
          }
        });

        function render () {
           added
            .transition()
            .duration(config.transition)
            .attr('width', xScale(scope.added));
        }
      }
    }
  }

  angular
    .module('hz.d3.lib', [])
    .factory('hzD3', ['$window', function ($window) {
      return $window.d3;
    }]);

  angular
    .module('hz.d3.bar', ['hz.d3.lib'])
    .directive('hzD3Bar', ['hzD3', 'hzD3BarConfig', hzD3Bar])
    .constant('hzD3BarConfig', {
      bg: '#fff',
      fg: ' #5cb85c',
      full: '#d9534f',
      addition: '#428bca',
      nearlyfull: '#f0ad4e',
      border: '#ccc',
      transition: 1000
    });

  angular.module('hz.d3', ['hz.d3.bar']);
}());
