'use strict';

var sweet = require('sweet.js');

/**
 * TODO: WHAT TO CALL THIS THING?
 * @param {Grunt} grunt
 * @param {Map<string,string>} options
 */
exports.init = function(grunt, options) {

	// TODO: load from options
	sweet.loadMacro(__dirname + '/macros/@.sjs');

	return {

		/*
		 * Release the macros.
		 * @param {string} string
		 * @returns {string}
		 */
		compile: function(string) {
			return sweet.compile(string, {
				readableNames: true
			}).code;
		}
	};
};
