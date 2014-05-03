"use strict";

/**
 * Add support for data types.
 * @extends {FunctionCompiler}
 */
class ScriptCompiler extends FunctionCompiler {

	/**
	 * Map observed types.
	 * Add custom sequence.
	 * @param {String} key
	 */
	constructor () {
		super ();
		this.inputs = Object.create ( null );
		this._sequence.splice ( 4, 0, this._declare );
	}
	

	// Private ...............................................................

	/**
	 * Handle instruction.
	 */
	_instruct ( pi ) {
		super._instruct ( pi );
		var atts = pi.attributes;
		switch ( pi.tag ) {
			case "input" :
				this.inputs [ atts.name ] = atts.type;
				break;
		}
	}

	/**
	 * Declare inputs.
	 * @param {String} script
	 * @returns {String}
	 */
	_declare ( script, head ) {
		var defs = [];
		each ( this.inputs, function ( name, type ) {
			head.declarations [ name ] = true;
			defs.push ( name + " = get ( " + type + " );\n" );
		}, this );
		if ( defs [ 0 ]) {
			head.functiondefs.push ( 
				"( function inputs ( get ) {\n" +
				defs.join ( "" ) +
				"}( this.script.inputs ));"
			);
		}
		return script;
	}

}
