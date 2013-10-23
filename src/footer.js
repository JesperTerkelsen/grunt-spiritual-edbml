"use strict";

/**
 * @param {String} source
 * @param {Map<String,object>} options
 * @returns {String}
 */
exports.compile = function ( edbml, options ) {
	if ( options.script ) {
		return new ScriptCompiler ().compile ( edbml );
	} else {
		return new FunctionCompiler ().compile ( edbml );
	}
};