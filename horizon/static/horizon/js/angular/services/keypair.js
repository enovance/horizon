/*global angular*/
'use strict';

angular
.module('hz.keypair.create', [])
.controller('ModalKeypairCreateCtrl', ['$scope', '$cookies', '$document',
	function ($scope, $cookies, $document) {
		var showError = false;
		$scope.form = {};

		$scope.showError = function () {
			showError = true;
			return $scope.form.CreateKeypairForm.$valid;
		};

		$scope.isOnError = function () {
			return $scope.form.CreateKeypairForm && $scope.form.CreateKeypairForm.$invalid &&
			($scope.form.CreateKeypairForm.$dirty || showError);
		};

		$scope.create = function () {
			var form = angular.element('<form>');

			form.attr('method', 'post');
			form.attr('action', '/workflow/keypair');
			form.attr('name', 'CreateKeypairForm');
			form.attr('target', 'keypair');
			form.attr('style', 'display:none');
			form.append(angular.element('<input type="hidden" name="csrfmiddlewaretoken" value="' +
				$cookies.csrftoken + '">'));
			form.append(angular.element('<input type="hidden" name="keypair_name" value="' + $scope.form.name + '">'));
			$cookies.keypairDL = 'true';
			$document.append(form);
			form.submit();
		};
	}])
.controller('iframeCtrl', ['$element', '$scope', '$cookies', '$interval',
	function ($element, $scope, $cookies, $interval) {
	var iframe = $element[0];
	var i;

	function bodyRetrieve() {
		$cookies.keypairDL = 'true';
		$scope.$apply(function () {
			$scope.form.error_message = angular.element(
				iframe.contentWindow.document.body.innerHTML).text();
		});
	}

	i = $interval(function() {
		if ($cookies.keypairDL === 'false') {
			$interval.cancel(i);
			$cookies.keypairDL = 'true';
			$scope.$close($scope.form.name);
		};
	}, 500);

	if (iframe.addEventListener) {
    iframe.addEventListener('load', bodyRetrieve, false);
	} else {
    iframe.attachEvent('onload', bodyRetrieve);
	}
}])
.service('keypairCreate', ['$modal', function ($modal) {
	this.open = function () {
		return $modal.open({
			keyboard: false,
      backdrop: 'static',
      templateUrl: '/workflow/keypairCreateTemplate',
      controller: 'ModalKeypairCreateCtrl'
    });
	}
}]);

angular
.module('hz.keypair.import', [])
.controller('ModalKeypairImportCtrl', ['$scope', '$http',
	function ($scope, $http) {
		var showError = false;
		$scope.form = {};

		$scope.showError = function () {
			showError = true;
			return $scope.form.ImportKeypairForm.$valid;
		};

		$scope.isOnError = function (control) {
			return control.$invalid &&
			(control.$dirty || showError);
		};

		$scope.import = function () {
			$http({
				method: 'POST',
				url: '/workflow/keypair',
				data: {
					keypair_name: $scope.form.name,
					public_key: $scope.form.public_key
				}
			})
			.then(
				function () {
					$scope.$close($scope.form.name);
				},
				function (error) {
					$scope.$dismiss(error);
				});
		};
	}])
.factory('keypairImport', ['$modal', function ($modal) {
	return {
		open: function () {
			return $modal.open({
				keyboard: false,
				backdrop: 'static',
				templateUrl: '/workflow/keypairImportTemplate',
				controller: 'ModalKeypairImportCtrl'
			})
		}
	};
}])
.config(['$httpProvider', function ($httpProvider) {
	$httpProvider.defaults.headers.post['Content-Type'] =
		'application/x-www-form-urlencoded;charset=utf-8';
}]);

angular.module('hz.keypair', ['hz.keypair.create', 'hz.keypair.import']);
