'use strict';

var TasksEven = function() {

}

TasksEven.prototype.Two = function(cb, results, ctx) {
	//results object can be read through keys in ctx.datadep
	//application logic goes here
	setTimeout(function() {
		cb(null,{'v': 2 });
	}, 100);
};

TasksEven.prototype.Four = function(cb, results, ctx) {
	//console.log(ctx);
	var factor1 = {}, factor2 = {};
	if(ctx && ctx.datadep) {
		factor1 = results[ctx.datadep[0]];
		factor2 = results[ctx.datadep[1]];
	}
	var tmp = factor1.v + (factor2 ?  factor2.v : 0);
	cb(null,{'v': tmp});
};


module.exports = TasksEven;