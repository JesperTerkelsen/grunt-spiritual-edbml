"use strict";

/**
 * @param {String} source
 * @param {Map<String,object>} options
 * @returns {String}
 */
exports.compile = function ( edbml, options, key ) {
	if ( edbml.contains ( "<?input" )) {
		return new ScriptCompiler ( key ).compile ( edbml, options );
	} else {
		return new FunctionCompiler ( key ).compile ( edbml, options );
	}
};