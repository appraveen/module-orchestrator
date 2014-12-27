'use strict';

var TasksOdd = function() {

}

TasksOdd.prototype.One = function(cb, results, ctx) {
	cb(null,{'v':1});
};

TasksOdd.prototype.Three = function(cb, results, ctx) {
	cb(null,{'v':3});
};

TasksOdd.text = function() {
	console.log("This is task three");
}
module.exports = TasksOdd;