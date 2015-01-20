# module-orchestrator

[![Build Status via Travis CI](https://api.travis-ci.org/appraveen/module-orchestrator.svg?branch=master)](https://travis-ci.org/appraveen/module-orchestrator)


Orchestrates modules based on configuration while resolving its dependencies concurrently. Applications typically web-based calls multiple services, process and aggregates the collected data from all services for every single request. Though parallel calls are addressed through libraries like [async](https://github.com/caolan/async) or [Q](https://github.com/kriskowal/q), there are lot of boilerplate code that every single application has to write. This module processor aims to solve that problem while reusing async for making use of parallelism.


## API

Orchestrator has to be instantiated and the input is passed as an object.  

```javascript

//create an object
var orch = new orchestrator(config);

//run the orchestrator	
orch.start(function(err, results) {
	// this callback function is called after orchestrator finish processing all modules
});
```

### Create

Pass the input configuration to orchestrator with the below information

* `name` - Name of the orchestrator
* `modules` - Contains the collection of all modules that are to be executed

```javascript
	{
	    //ModuleDescription
			"ModuleName1": { //Name of the module
				"path": "modules/TasksOdd", //Path to find this module. 
				"on":"One", //Call this function after finding the module
				"dependency":[] //Optional. array of dependencies
			},
			"ModuleName2" : {
			  ...
			  "dependency":["ModuleName1"] //Any dependency mentioned here should exists in 'modules'
			}
		}
```
* `pathToContext` - Relative path to set the context on directory. Value of this property is prefixed before every `Module.path`. This is helpful when another node module wraps this orchestrator and you can set the context to any level
* `moduleResolver` - Module Resolver provides a way to find the function that has to be executed. Module orchestrator comes with default resolver and you can pass one to override the default. Default resolver looks up the path and do a require with `pathToContext`
* `ctxResolver` -  `ContextResolver` provides a way to build context for a module and the constructed context from the resolver is passed on to the actual module during execution
* `onModuleComplete` - Callback to be called when a module is completed with either success or failure
* `timeout` - Timeout for a task to complete
* `diagnosis` - When set to true, orchestrator exposes `stats` object on the final callback function. `stats` contains time taken to complete the modules and the orchestrator as well as the completion state(SUCCESS or FAILURE). Sample stats object would look like
````javascript
{ 
  sampleOrchestrator: { took: '103ms' }, //time taken for the orchestrator to complete
  ModuleOne: { took: '1ms', state: 'COMPLETED_SUCCESS' }, 
  ModuleTwo: { took: '101ms', state: 'COMPLETED_SUCCESS' },
  ModReturnParam: { took: '0ms', state: 'COMPLETED_FAILURE' },
  ModuleThree: { took: '0ms', state: 'COMPLETED_SUCCESS' },
  ModuleFour: { took: '0ms', state: 'COMPLETED_SUCCESS' } 
}
````
 Refer test/app-module-test for stats usage

### Run
After `start` is called on orchestrator, it delegates the work to async auto. Output of every module is stored in `results` object and passed on to every module execution. 

#### Sample Module declaration
Every function whose reference is mentioned in `ModuleDescription` should hanldle three arguments

* `cb` - callback. this function accepts `err` as first parameter and `result` as second parameter
* `results` - results from modules that were executed before the current module
* `ctx` - context object for the current module. this object is constructed using `ctxResolver`

```javascript
var One = function(cb, results, ctx) {
  //do application specific stuff;
      // read init values from ctx
      // read data dependency from results
      //call a service or resolve a promise here 
  //finally call the callback pass error and output of this function
  //Note: when a promise is passed as the output, all the modules that depend on this output must understand that the result is a promise    
	cb(null,{});
};
````
Refer test\modules\*.js for more information on how modules can be structured and used.
