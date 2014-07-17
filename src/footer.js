"use strict";

/**
 * @param {String} source
 * @param {Map<String,object>} options
 * @param {string} scriptid
 * @returns {String}
 */
exports.compile = function ( edbml, options ) { // scriptid
	if ( edbml.contains ( "<?input" )) {
		return new ScriptCompiler ().compile ( edbml, options /*scriptid*/ );
	} else {
		return new FunctionCompiler ().compile ( edbml, options /*scriptid*/ );
	}
};
