'use strict';

var TasksOdd = {};

TasksOdd.One = function(cb) {
	cb(null,{'v':1});
};

TasksOdd.Three = function(cb) {
	cb(null,{'v':3});
};

TasksOdd.text = function() {
	console.log('This is task three');
};

module.exports = TasksOdd;