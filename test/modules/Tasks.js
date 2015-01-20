'use strict';
var Q = require('q');

var Tasks = function() {
	console.log('generic tests');
};


Tasks.Test = function(cb) {
	//console.log(ctx);
	console.log('generic tasks');
	cb(null,{'v': 10 });
};

Tasks.TestPromise = function(cb) {
	var deffered = Q.defer();
	setTimeout(function() {
		deffered.resolve({'v': 10 });
	}, 500);
	cb(null,deffered.promise);
};

Tasks.timeout = function(cb) {
	setTimeout(function() {
		cb(null,{});
	}, 1000);
	
};

module.exports = Tasks;