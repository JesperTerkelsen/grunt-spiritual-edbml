var inliner = require ( "./things/inliner" );
var outliner = require ( "./things/outliner" );

/**
 * Here it comes.
 * @param {Grunt} grunt
 */
module.exports = function ( grunt ) {

	"use strict";
	grunt.registerMultiTask ( "edbml", "Trawl EDBML", function () {
		var options = this.options ();
		if ( options.inline ) {
			inliner.process ( grunt, this.data.src, options );
		} else {
			outliner.process ( grunt, this.data.files, options );
		}
	});

};
