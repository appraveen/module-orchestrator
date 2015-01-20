'use strict';
var chai = require('chai'),
	assert = chai.assert,
	should = chai.should(),
	orchestrator = require('../lib/Orchestrator'),
	helper = require('./modules/helper');

describe('application-modules-test', function() {

	it(' verify module execution based on configuration', function(done) {
		var ipmodules = require('./modules/modules.json');
		var obj = helper.constructObject('orch-app-test-config', ipmodules);

		var ctxBuilder = function(name) {
			var module = ipmodules[name];
			if (!module) {
				return null;
			}

			var ctx = {};
			if (module.config) {
				ctx.config = module.config;
			}

			ctx.datadep = module.dependency;

			//add additional stuff to config based on 
			//request parameter or other context

			return ctx;

		};

		obj.ctxResolver = ctxBuilder;
		obj.diagnosis = true;
		obj.onModuleComplete = function(err, results, moduleName) {
			console.info(moduleName, err, results);
		};

		var orch = new orchestrator(obj);
		orch.start(function(err, results, stats) {
			console.log(stats);
			assert.typeOf(results, 'object');
			results.ModuleOne.v.should.equal(1);
			results.ModuleTwo.v.should.equal(2);
			results.ModuleThree.v.should.equal(3);
			results.ModuleFour.v.should.equal(5);
			done();
		});

	});

});