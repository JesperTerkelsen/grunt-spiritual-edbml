"use strict";

class FunctionResult {

	/**
	 * @param {String} body
	 * @param {Array<String>} params
	 */
	constructor ( body, params ) {
		this.js = this._tojs ( body, params );
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