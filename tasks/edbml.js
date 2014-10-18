"use strict";

var inliner = require("./things/inliner");
var outliner = require("./things/outliner");
var macrunner = require("./things/macrunner");

/**
 * Here it comes.
 * @param {Grunt} grunt
 */
module.exports = function(grunt) {
	grunt.registerMultiTask("edbml", "Trawl EDBML", function() {
		var options = this.options();
		var macros = macrunner.init(grunt, options);
		var done = this.async();
		if (options.inline) {
			inliner.process(grunt, this.files, options, macros, done); //!!!!
		} else {
			outliner.process(grunt, this.data.files, options, macros, done);
		}
	});
};
