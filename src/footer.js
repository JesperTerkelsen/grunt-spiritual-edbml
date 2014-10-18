"use strict";

/**
 * @param {String} source
 * @param {Map<String,object>} options
 * @param {???} macros
 * @param {Map<String,object>} directives
 * @returns {String}
 */
exports.compile = function(edbml, options, macros, directives) {
	if (edbml.contains("<?input")) {
		return new ScriptCompiler().compile(edbml, options, macros, directives);
	} else {
		return new FunctionCompiler().compile(edbml, options, macros, directives);
	}
};
