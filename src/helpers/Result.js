"use strict";

/**
 * Compile to function.
 */
class Result {

	/**
	 * @param {String} body
	 * @param {Array<String>} params
	 * @param {Array<Instruction>} instructions
	 */
	constructor ( body, params, instructions ) {
		this.js = this._tojs ( body, params );
		this.instructions = instructions;
	}

	/**
	 * Parse to function source.
	 * @throws {Error}
	 * @param {String} script
	 * @param @optional (Array<String>} params
	 */
	_tojs ( body, params ) {
		try {
			params = Array.isArray ( params ) ? params.join ( "," ) : "";
			return new Function ( params, body ).toString ();
		} catch ( exception ) {
			console.error ( "Source dysfunction", body );
			console.trace ( exception );
		}
	}
}
