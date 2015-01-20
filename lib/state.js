'use strict';

var _ = require('underscore');

var TASK_STATE = {
	'INIT': 0,
	'RUNNING': 1,
	'COMPLETED_SUCCESS': 2,
	'COMPLETED_FAILURE': 3
};

TASK_STATE.get = function(id) {
	var key;

	_.each(this, function(v, k) {
		if (v === id) {
			key = k;
			return false;
		}
	});

	return key;
};

module.exports = TASK_STATE;