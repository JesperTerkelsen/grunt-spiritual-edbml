"use strict";

/**
 * Add support for data types.
 * @extends {FunctionCompiler}
 */
class ScriptCompiler extends FunctionCompiler {

	/**
	 * @param {String} key
	 */
	constructor ( key ) {

		/**
		 * Observed data types.
		 * @type {Map<String,String}
		 */
		this.inputs = Object.create ( null );	
		super ( key );
	}
	

	// Private ...............................................................

	/**
	 * Handle instruction.
	 */
	_instruct ( pi ) {
		super._instruct ( pi );
		var atts = pi.atts;
		switch ( pi.type ) {
			case "input" :
				this.inputs [ atts.name ] = atts.type;
				break;
		}
	}

	/**
	 * Declare.
	 * @overrides {FunctionCompiler} declare
	 * @param {String} script
	 * @returns {String}
	 */
	_declare ( script, head ) {
		super._declare ( script, head );
		return this._declareinputs ( script, head );
	}

	/**
	 * Declare inputs.
	 * @param {String} script
	 * @returns {String}
	 */
	_declareinputs ( script, head ) {
		var defs = [];
		each ( this.inputs, function ( name, type ) {
			head.declarations [ name ] = true;
			defs.push ( name + " = get ( " + type + " );\n" );
		}, this );
		if ( defs [ 0 ]) {
			head.functiondefs.push ( 
				"( function inputs ( get ) {\n" +
				defs.join ( "" ) +
				"})( this.script.inputs );" 
			);
		}
		return script;
	}

}