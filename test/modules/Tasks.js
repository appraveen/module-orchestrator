'use strict';

var Tasks = function() {
	console.log("generic tests");
}


Tasks.Test = function(cb, results, ctx) {
	//console.log(ctx);
	console.log('generic tasks');
	cb(null,{'v': 10 });
};


module.exports = Tasks;