'use strict';

module.exports.constructObject = function(name, ipmodules) {
	var dictionary = require('./ModuleDictionary.json');
	var obj = {};
	obj.name = name;
	obj.modules = {};
	obj.pathToContext = '../../';

	for(var mod in ipmodules) {
		obj.modules[mod] = dictionary[mod];
		if(ipmodules[mod].dependency) {
			obj.modules[mod].dependency = ipmodules[mod].dependency;
		}
	}
	
	return obj;	
};
