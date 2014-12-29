'use strict';
var async = require('async');
/*
	obj.name Name of the orchestrator
	obj.modules
		{
			"ModuleName": { //Name of the module
				"path": "modules/TasksOdd", //Path to find this module. require(path)
				"fn":"One", //Call any function after finding the module
				"fntype":"instance" //invoke as instance or static
				"dependency":[] //array of dependencies
			},
		}
	obj.fnResolver Overrides default functionResolver
	obj.ctxResolver ContextResolver

*/

var Orchestrator = function(obj) {
    this.name = obj.name;
    this.tasks = {};
   	
   	if (obj.fnResolver && typeof obj.fnResolver !== 'function') {
			throw new Error('fnresolver should be a function');
	}
   	this.fnResolver = obj.fnResolver;
   	if (obj.ctxResolver && typeof obj.ctxResolver !== 'function') {
			throw new Error('Context Resolver should be a function');
	}

	this.modules = obj.modules;
   	this.ctxResolver = obj.ctxResolver;
   	this.pathToContext = obj.pathToContext;

   	if(this.modules) {
		for(var key in this.modules) {
			var mod = this.modules[key];
			this.addModule(key, mod.dependency);
		}
	}
	this.started = false;
};




Orchestrator.prototype.addModule = function(name, dep) {
	var fn, ctx;
	// validate name is a string, dep is an array of strings, and fn is a function
	if (typeof name !== 'string') {
		throw new Error('Module Name is required. Type:String');
	}

	if(this.tasks[name])
		throw new Error("Module "+name +" is already defined");
	
	dep = dep || [];
	
	if (!Array.isArray(dep)) {
		throw new Error('Module '+name+' can\'t support dependencies that is not an array of strings');
	}

	dep.forEach(function (item) {
			if (typeof item !== 'string') {
				throw new Error('Task '+name+' dependency '+item+' is not a string');
			}
	});


	fn = (this.fnResolver) ? this.fnResolver(name) :
		this.functionResolver(name);
	
	fn = fn || function () {}; // no-op
	
	if(this.ctxResolver)
		ctx = this.ctxResolver(name);

	this.tasks[name] = {
			fn: fn,
			dep: dep,
			name: name,
			ctx: ctx,
			log:[]
	};
}

Orchestrator.prototype.getModules = function() {
	return this.tasks;
} 


Orchestrator.prototype.start = function(ocb) {
	var orch = this, hereby =10;
	
	//Strange! without this line var ocb is not available when called in below callback
	ocb = ocb || function() {}; 

	if(!this.tasks) {
		ocb(new Error('No tasks found to execute'));
	}

	var orchName = 'mod-orch '+this.name;
	if(this.started) {
		throw new Error(orchName + ' is already running');	
	}

	
	console.time(orchName);
	var asynData = {};

	for(var name in this.tasks) {
		asynData[name] = createTask(this.tasks[name]);
	}
	
	dependencyValidator(asynData, this.tasks);

	this.started = true;

	async.auto(asynData, function(err, results) {
		orch.started = false;
		ocb(err, results);
		console.timeEnd(orchName);
	});
}

/*
	Default function resolver
	Find a reference to the function based on module definition
	path, fn and fntype
*/
Orchestrator.prototype.functionResolver = function(name) {
			var temp = this.modules[name], cls;
			if(!temp) return null;

			try {
				cls = require( this.pathToContext + temp.path);
			} catch(e) {
				throw new Error("cannot resolve "+( this.pathToContext + temp.path) +
				" " + name + " has incorrect mapping to function");
			}
			
			var functionName = temp.fn;

			if(functionName) {
				if(temp.fntype === 'instance') {
					var obj = new cls();
					return obj[functionName];
				}
				return cls[functionName];
			}
			return cls;
};

var createTask = function(task) {
	var wrap = function(cb, results) {
		task.fn(cb, results, task.ctx)
	}
	
	if(task.dep && task.dep.length > 0) {
		var arr = [];
		for(var k=0; k < task.dep.length; k++)
			arr.push(task.dep[k])		
		arr.push(wrap);
		return arr;
	} else {
		return wrap;
	}
};

var dependencyValidator = function(asyncData, tasks) {
	if(!asyncData) return;

	var arr, i=0, dep=[];
	for(var task in asyncData) {
		dep=[];
		arr = asyncData[task];
		if(typeof arr === 'object') {
 			while(typeof arr[i] !== 'function' && i < arr.length) {
				if(!asyncData[arr[i]]) {
					tasks[task].log.push(arr[i]+ " is not valid. Removed from dependency");
					arr.splice(i,1);
				} else {
					i++;
				}
			}
		} 
		
	}
}

module.exports = Orchestrator;