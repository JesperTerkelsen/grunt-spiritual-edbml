"use strict";

class FunctionResult {

	/**
	 * @param {String} body
	 * @param {Array<String>} params
	 */
	constructor ( body, params ) {
		this.runnable = this._torunnable ( body, params );
		this.type = "function";
	}

	/**
	 * Parse function source to runnable function.
	 * @throws {Error}
	 * @param {String} script
	 * @param @optional (Array<String>} params
	 */
	_torunnable ( body, params ) {
		try {
			params = Array.isArray ( params ) ? params.join ( "," ) : "";
			return new Function ( params, body ).toString ();
		} catch ( exception ) {
			console.error ( "Source dysfunction", body );
			console.trace ( exception );
		}
	}
}