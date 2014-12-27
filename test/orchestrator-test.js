'use strict';
var chai = require('chai');
var assert = chai.assert;
var should = chai.should();
var orchestrator  =  require('../lib/orchestrator');
var helper = require('./helper');


describe("orchestrator-test", function() {

	it("execute module with bad dependency", function(done) {
		var ipmodules = {
			"ModuleOne" : {},
			"ModuleTwo" : {"dependency":["1","ModuleOne"]}
		};

		var obj = helper.constructObject("orch test 1", ipmodules);
		var orch = new orchestrator(obj);
	
		orch.start(function(err, results) {
			assert.typeOf(results, 'object');
			results.ModuleOne.v.should.equal(1);
			results.ModuleTwo.v.should.equal(2);
			done();	
		});
	
	});

	it("throw error on wrong dependency value data type", function(done) {
		var ipmodules = {
			"ModuleOne" : {},
			"ModuleTwo" : {"dependency":[1,"ModuleOne"]}
		};

		var obj = helper.constructObject("orch test 2", ipmodules);
		
		try {
			new orchestrator(obj);
		} catch(e) {
			done();

		}
	});

	it("throw error on wrong data type", function(done) {
		var ipmodules = {
			"ModuleOne" : {},
			"ModuleTwo" : {"dependency":{"1":"ModuleOne"}}
		};

		var obj = helper.constructObject("orch test 3", ipmodules);
		
		try {
			new orchestrator(obj);
		} catch(e) {
			done();

		}
	});


});