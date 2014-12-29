'use strict';
var Q = require('q');

var Tasks = function() {
	console.log("generic tests");
}


Tasks.Test = function(cb, results, ctx) {
	//console.log(ctx);
	console.log('generic tasks');
	cb(null,{'v': 10 });
};

Tasks.TestPromise = function(cb, results, ctx) {
	var deffered = Q.defer();
	setTimeout(function() {
		deffered.resolve({'v': 10 });
	}, 100);
	cb(null,deffered.promise);
};

module.exports = Tasks;