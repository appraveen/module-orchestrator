'use strict';
var chai = require('chai'),
	assert = chai.assert,
	_ = require('underscore'),
	STATE = require('../lib/state');

describe('Task State', function() {

	it('check values', function() {
		assert(STATE.INIT === 0);
		assert(STATE.RUNNING === 1);
		assert(STATE.COMPLETED_SUCCESS === 2);
		assert(STATE.COMPLETED_FAILURE === 3);
		assert(_.keys(STATE).length === 5, 'not all values are tested');
	});

	it('verify get', function() {
		assert(STATE.get(0) === 'INIT');
		assert(STATE.get(1) === 'RUNNING');
		assert(STATE.get(2) === 'COMPLETED_SUCCESS');
		assert(STATE.get(3) === 'COMPLETED_FAILURE');

	});
});