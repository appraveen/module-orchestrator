'use strict';
var async = require('async'),
	_ = require('underscore'),
	STATE = require('./state');

// Private functions
var createTask,
	onComplete,
	dependencyValidator,
	getTimeinMs;
/*
	config.name Name of the orchestrator
	config.modules
		{
			"ModuleName": { 				//Name of the module
				"path": "modules/TasksOdd", //Path to find this module. Orchestrator 
												will invoke require(path)
				"on":"Nameofthefunction", 	//Optional if path resolves to a function. 
												Call this function after finding the module
				"dependency":[] 			//array of dependencies
			},
		}
	config.moduleResolver 		Overrides default moduleResolver
	config.ctxResolver    		ContextResolver
	config.pathToContext  		Relative path to be used before every Module path
	config.onModuleComplete Callback after every task is completed
	config.timeout 				Timeout for a task to complete
*/

var Orchestrator = function(config) {

	this.name = config.name;
	this.tasks = {};

	this.onModuleComplete = config.onModuleComplete;
	this.started = false;


	if (config.moduleResolver && !_.isFunction(config.moduleResolver)) {
		throw new Error('moduleResolver should be a function');
	}

	this.moduleResolver = config.moduleResolver;

	if (config.ctxResolver && !_.isFunction(config.ctxResolver)) {
		throw new Error('Context Resolver should be a function');
	}

	this.modules = config.modules;
	if (!_.isObject(this.modules)) {
		throw new Error('Modules should be an object');
	}

	this.ctxResolver = config.ctxResolver;
	this.pathToContext = config.pathToContext;
	this.timeout = config.timeout || 2000;

	if (!_.isEmpty(this.modules)) {

		Object.keys(this.modules).forEach(function(taskName) {
			var mod = this.modules[taskName];
			this.addModule(taskName, mod.dependency);
		}.bind(this));

	}

	if (config.diagnosis) {
		this.stats = {};
	}
};


Orchestrator.prototype.addModule = function(taskName, dep) {
	var on, ctx;
	// validate name is a string, dep is an array of strings, and on is a function
	if (!_.isString(taskName)) {
		throw new Error('Module Name is required. Type:String');
	}

	if (this.tasks[taskName]) {
		throw new Error('Module ' + taskName + ' is already registered');
	}

	dep = dep || [];

	if (!Array.isArray(dep)) {
		throw new Error('Module ' + taskName +
			' can\'t support dependencies that is not an array of strings');
	}

	dep.forEach(function(depTask) {
		if (!_.isString(depTask)) {
			throw new Error('Task ' + taskName +
				' dependency ' + depTask + ' is not a string');
		}
	});


	on = (this.moduleResolver) ?
		this.moduleResolver(taskName) :
		this.taskResolver(taskName);

	//TODO: log when this default function is invoked
	var defaultCallBack = function(cb) {
		//console.log('default callback ', taskName);
		cb();
	};

	//do not allow default callback on strict mode
	on = _.isFunction(on) ? on : defaultCallBack;


	if (this.ctxResolver) {
		ctx = this.ctxResolver(taskName);
	}

	this.tasks[taskName] = {
		on: on,
		dep: dep,
		name: taskName,
		ctx: ctx,
		log: []
	};
};

Orchestrator.prototype.getModules = function() {
	return this.tasks;
};


Orchestrator.prototype.start = function(ocb) {
	var orch = this;

	//Strange! without this line var ocb is not available 
	//when called in below callback
	ocb = ocb || function() {};

	if (!orch.tasks) {
		ocb(new Error('No tasks found to execute'));
	}


	if (orch.started) {
		throw new Error(orch.name + ' is already running');
	}

	if (orch.stats) {
		orch.stats[orch.name] = {};
		orch.stats[orch.name].start = process.hrtime();
	}
	var asyncData = {};

	for (var name in orch.tasks) {
		asyncData[name] = createTask(orch.tasks[name], orch);
	}

	dependencyValidator(asyncData, orch);

	orch.started = true;

	async.auto(asyncData, function(err, results) {
		orch.started = false;
		onComplete(err, results, orch);
		ocb(err, results, orch.stats);
	});

};

/*
	Default function resolver
	Find a reference to the function based on module definition
	'path' and 'on'
*/
Orchestrator.prototype.taskResolver = function(taskName) {
	var task = this.modules[taskName],
		taskModule;

	if (!task) {
		return null;
	}

	try {
		taskModule = require(this.pathToContext + task.path);
	} catch (e) {
		throw new Error('cannot resolve ' + (this.pathToContext + task.path) +
			' ' + taskName + ' has incorrect mapping to function');
	}

	if (!_.isObject(taskModule)) {
		return null;
	}

	return (!task.on) ? taskModule : taskModule[task.on];

};

createTask = function(task, orchRef) {

	var asyncAutoCallback = function(cb, results) {

		var taskCompletedCallback = function(err, res) {

			task.state = err ? STATE.COMPLETED_FAILURE : STATE.COMPLETED_SUCCESS;
			if (orchRef.onModuleComplete) {
				orchRef.onModuleComplete(err, res, task.name);
			}

			if (orchRef.stats) {
				orchRef.stats[task.name].took = getTimeinMs(
					process.hrtime(orchRef.stats[task.name].start)) + 'ms';
				orchRef.stats[task.name].state = STATE.get(task.state);
				delete orchRef.stats[task.name].start;
			}

			cb(err, res);
		};

		task.state = STATE.RUNNING;
		try {
			if (orchRef.stats) {
				orchRef.stats[task.name] = {};
				orchRef.stats[task.name].start = process.hrtime();
			}
			task.on(taskCompletedCallback, results, task.ctx);
		} catch (e) {
			taskCompletedCallback(e, null);
		}

		setTimeout(function() {
			if (task.state === STATE.RUNNING) {
				taskCompletedCallback(new Error('timeout'), null);
			}
		}, orchRef.timeout);
	};

	task.state = STATE.INIT;
	var dep;
	//when dependencies exists return ['dep1','dep2', callback];
	if (task.dep && task.dep.length) {
		dep = [];

		task.dep.forEach(function(aTask) {
			dep.push(aTask);
		});

		dep.push(asyncAutoCallback);

		return dep;
	}

	//return only the callback
	return asyncAutoCallback;

};

onComplete = function(err, results, orchRef) {
	if (orchRef.stats) {
		orchRef.stats[orchRef.name].took = getTimeinMs(
			process.hrtime(orchRef.stats[orchRef.name].start)) + 'ms';
		delete orchRef.stats[orchRef.name].start;
	}
};

dependencyValidator = function(asyncData, orchRef) {
	if (!asyncData) {
		return;
	}

	var taskData;

	Object.keys(asyncData).forEach(function(taskName) {
		taskData = asyncData[taskName];

		if (_.isFunction(taskData)) {
			//no dependencies exist
			return;
		}

		/*
			taskData can be just a callback function or
			 an array ['dep1', 'dep2', callback]
			check dependencies provided in the array are available
		*/

		for (var k = 0, data; k < taskData.length; k++) {
			data = taskData[k];

			if (!_.isFunction(data) && !asyncData[data]) {

				orchRef.tasks[taskName].log.push(data +
					' is not valid. Removed from dependency');
				taskData.splice(k, 1);

			}
		}

	});
};

getTimeinMs = function(processTime) {
	return processTime ?
		Math.round((processTime[0] * 1000) + (processTime[1] / 1000000)) : 0;
};

module.exports = Orchestrator;