"use strict";

class ScriptResult extends FunctionResult {

	constructor ( body, params, inputs ) {
		super ( body, params );
		if ( Object.keys ( inputs ).length ) {
			this.inputs = inputs;
		} else {
			this.inputs = null;
		}
	}
}
