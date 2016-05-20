"use strict";
var moduleName = 'ui.router.default';
/* commonjs package manager support (eg componentjs) */
if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){
	module.exports = moduleName;
}
var max_redirects = 10;
angular.module(moduleName, ['ui.router'])
	.config(['$provide', function($provide) {
		$provide.decorator('$state', ['$delegate', '$injector', function($delegate, $injector) {
			var transitionTo = $delegate.transitionTo;
			$delegate.transitionTo = function(to, toParams, options) {
				var numRedirects = 0;
				while(numRedirects++ < max_redirects) {
					var target = this.get(to, this.$current);
					if(target && target.abstract && target.abstract !== true) {
						var childState = target.abstract;
						if(!angular.isString(childState)) {
							childState = $injector.invoke(childState);
						}
						if(childState[0] == '.') {
							to += childState;
						} else {
							to = childState;
						}
					} else {
						break;
					}
				}
				if(numRedirects >= max_redirects) {
					throw new Error("Too many abstract state default redirects");
				}
				return transitionTo.call($delegate, to, toParams, options);
			};
			return $delegate;
		}])
	}]);
