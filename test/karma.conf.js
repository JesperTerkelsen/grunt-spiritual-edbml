/*global module*/
module.exports = function(config) {
	'use strict';
	var pack = require('../package.json');
	console.log('../dist/spiritual-gui-' + pack.version + '.js');
	config.set({
		frameworks: ['jasmine'],
		files: [
			'karma.setup.js',
			'build/**/*.js'
			//{pattern: 'xxx', included: false}
		],
		browsers: ['Chrome'],
		singleRun: false,
		preprocessors: {},
		reporters: ['progress']
	});
};
