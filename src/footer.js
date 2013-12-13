"use strict";

/**
 * @param {String} source
 * @param {Map<String,object>} options
 * @returns {String}
 */
exports.compile = function ( edbml, options ) {
	if ( edbml.contains ( "<?input" )) {
		return new ScriptCompiler ().compile ( edbml, options );
	} else {
		return new FunctionCompiler ().compile ( edbml, options );
	}
};
