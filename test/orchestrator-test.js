'use strict';

var chai = require('chai'),
	assert = chai.assert,
	should = chai.should(),
	orchestrator = require('../lib/Orchestrator'),
	helper = require('./modules/helper');


describe('orchestrator-test', function() {
	it('timef', function(done) {
		this.timeout(3000);
		var time = process.hrtime();
		setTimeout(function() {
			console.log(time);
			var diff = process.hrtime(time);
			console.log(Math.round((diff[0] * 1000) + (diff[1] / 1000000)));
			done();
		}, 2000);
	});

	it('execute module with moduleResolver', function(done) {
		var ipmodules = {
			'name': 'test',
			'moduleResolver': function(moduleName) {
				return (moduleName === 'ModuleOne') ?
					require('./modules/TasksOdd').One :
					require('./modules/TasksEven').Two; 
			},
			'modules': {
				'ModuleOne': [],
				'ModuleTwo': ['ModuleOne']
			}
		};
		//Module Name that does not exists in input configuration is decaled as bad
		//dependency and the original module is still executed by discarding 
		//bad depdencies. In this case '1' is ignored.

		//var obj = helper.constructObject('orch test 1', ipmodules);
		var orch = new orchestrator(ipmodules);

		orch.start(function(err, results) {
			console.log(results);
			assert.typeOf(results, 'object');
			results.ModuleOne.v.should.equal(1);
			results.ModuleTwo.v.should.equal(2);
			done();
		});

	});

	it('execute module with bad dependency', function(done) {
		var ipmodules = {
			'ModuleOne': {},
			'ModuleTwo': {
				'dependency': ['1', 'ModuleOne']
			}
		};
		//Module Name that does not exists in input configuration is decaled as bad
		//dependency and the original module is still executed by discarding 
		//bad depdencies. In this case '1' is ignored.

		var obj = helper.constructObject('orch test 1', ipmodules);
		var orch = new orchestrator(obj);

		orch.start(function(err, results) {
			assert.typeOf(results, 'object');
			results.ModuleOne.v.should.equal(1);
			results.ModuleTwo.v.should.equal(2);
			done();
		});

	});

	it('throw error on wrong dependency value data type', function(done) {
		var ipmodules = {
			'ModuleOne': {},
			'ModuleTwo': {
				'dependency': [1, 'ModuleOne']
			}
		};

		var obj = helper.constructObject('orch test 2', ipmodules);

		try {
			new orchestrator(obj);
		} catch (e) {
			done();

		}
	});

	it('throw error on wrong data type', function(done) {
		var ipmodules = {
			'ModuleOne': {},
			'ModuleTwo': {
				'dependency': {
					'1': 'ModuleOne'
				}
			}
		};

		var obj = helper.constructObject('orch test 3', ipmodules);

		try {
			new orchestrator(obj);
		} catch (e) {
			done();

		}
	});

	it('starting the same instance when the current one is running',
		function(done) {
			var ipmodules = {
				'ModuleOne': {},
				'ModuleTwo': {
					'dependency': ['1', 'ModuleOne']
				}
			};

			var obj = helper.constructObject('orch test 4', ipmodules);
			var orch = new orchestrator(obj);
			orch.start();
			try {
				orch.start();
			} catch (e) {
				done();
			}
		});

	it('test promises', function(done) {
		this.timeout(2000);
		var ipmodules = {
			'ModuleTestPromise': {},
			'ModuleSix': {
				'dependency': ['ModuleTestPromise']
			}
		};

		var obj = helper.constructObject('orch test promise', ipmodules);
		obj.timeout = 1000;
		var o = new orchestrator(obj);
		o.start(function(err, results) {
			results.ModuleSix.v.should.equal(20);
			done();
		});

	});

	it('verify timeout', function(done) {
		this.timeout(2000);
		var ipmodules = {
			'Timeout': {}
		};

		var obj = helper.constructObject('orch test timeout', ipmodules);
		obj.timeout = 500;
		var o = new orchestrator(obj);
		o.start(function(err) {
			assert(err.message === 'timeout');
			done();
		});

	});


});