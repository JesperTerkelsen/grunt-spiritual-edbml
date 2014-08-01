"use strict";

var inliner = require ( "./things/inliner" );
var outliner = require ( "./things/outliner" );

/**
 * Here it comes.
 * @param {Grunt} grunt
 */
module.exports = function ( grunt ) {
	grunt.registerMultiTask ( "edbml", "Trawl EDBML", function () {
		var options = this.options (), done = this.async();
		if ( options.inline ) {
			inliner.process ( grunt, this.data.src, this.data.dest, options, done );
		} else {
			outliner.process ( grunt, this.data.files, options, done );
		}
	});
};