"use strict";

/**
 * Script compiler.
 * @extends {FunctionCompiler}
 */
class ScriptCompiler extends FunctionCompiler {

	/**
	 * Map observed types.
	 * Add custom sequence.
	 * @param {string} key
	 */
	constructor() {
		super();
		this.inputs = {};
	}


	// Private ...................................................................

	/**
	 * Handle instruction.
	 * @overrides {FunctionCompiler._instruct}
	 * @param {Instruction} pi
	 */
	_instruct(pi) {
		super._instruct(pi);
		var atts = pi.att;
		switch (pi.tag) {
			case "input":
				this.inputs[atts.name] = atts.type;
				break;
		}
	}

	/**
	 * Define stuff in head.
	 * @param {string} script
	 * @param {object} head
	 * @returns {string}
	 */
	_definehead(script) {
		script = super._definehead(script);
		each(this.inputs, (name, type) => {
			this._head[name] = '$edbml.$input(' + type + ')';
		}, this);
		return script;
	}

}
