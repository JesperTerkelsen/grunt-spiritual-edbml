"use strict";

class ScriptResult extends FunctionResult {

	constructor ( body, params, inputs ) {
		super ( body, params );
		this.inputs = inputs;
		this.type = "script";
	}
}
