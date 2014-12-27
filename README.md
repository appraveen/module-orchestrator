# module-orchestrator

[![Build Status via Travis CI](https://api.travis-ci.org/appraveen/module-orchestrator.svg?branch=master)](https://travis-ci.org/appraveen/module-orchestrator)


Orchestrates modules based on configuration while resolving its dependencies concurrently. Applications typically web-based calls multiple services, process and aggregates the collected data from all services for every single request. Though parallel calls are addressed through libraries like [async](https://github.com/caolan/async) or [Q](https://github.com/kriskowal/q), there are lot of boilerplate code that every single application has to write. This module processor aims to solve that problem while reusing async for making use of parallelism.


## API

Orchestrator has to be instantiated and the input is passed as an object.  

```javascript

//create an object
var orch = new orchestrator(inputObj);

//run the orchestrator	
orch.start(function(err, results) {
	// this callback function is called after orchestrator finish processing all modules
});
```

### Create

Pass the input object to orchestrator with the below information

__ObjectProperties__

* `name` - Name of the orchestrator
* `modules` - Contains the collection of all modules that are to be executed

```javascript
	{
	    //ModuleDescription
			"ModuleName1": { //Name of the module
				"path": "modules/TasksOdd", //Path to find this module. 
				"fn":"One", //Call this function after finding the module
				"fntype":"instance" //invoke as instance or static. In case of instance, an object is created on the function that existed in the path. Example: (new TasksOdd()).One()
				"dependency":[] //Optional. array of dependencies
			},
			"ModuleName2" : {
			  ...
			  "dependency":["ModuleName1"]
			}
		}
```

* `fnResolver` - Function Resolver provides a way to find the function that has to be executed. Module orchestrator comes with default resolver and you can pass one to override the default
* `ctxResolver` -  `ContextResolver` provides a way to build context for a module and the constructed context from the resolver is passed on to the actual function during execution
* `pathToContext` - Relative path to set the context on directory. Value of this property is prefixed before every `Module.path`.
 
### Run
After `start` is called on orchestrator, it delegates the work to async auto. Output of every module is stored in `results` object and passed on to every module execution. 

#### Sample Module declaration
Every function whose reference is mentioned in `ModuleDescription` should hanldle three arguments

* `cb` - callback. this function accepts `err` as first parameter and `result` as second parameter
* `results` - results from modules that were executed before the current module
* `ctx` - context object for the current module. this object is constructed using `ContextResolver`

```javascript
var One = function(cb, results, ctx) {
  //do application specific stuff;
      // read init values from ctx
      // read data dependency from results
      //call a service or resolve a promise here 
  //finally call the callback pass error and output of this function    
	cb(null,{});
};
````

Refer test\app-module-test.js for more information on how modules can be structured and used.
