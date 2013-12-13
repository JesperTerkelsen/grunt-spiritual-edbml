"use strict";

/**
 * Collapsing everything into a single function declaration.
 */
class Result { 

	/**
	 * @param {String} body
	 * @param {Array<String>} params
	 * @param {Array<Instruction>} instructions
	 */
	constructor ( body, params, instructions ) {
		this.functionstring = this._tofunctionstring ( body, params );
		this.instructionset = instructions;
		this.errormessage = null;
	}

	/**
	 * Compute single function declaration.
	 * @param {String} script
	 * @param @optional (Array<String>} params
	 * @returns {String}
	 */
	_tofunctionstring ( body, params = []) {
		try {
			var js = new Function ( params.join ( "," ), body ).toString ();
			return this._wraparound ( js );
		} catch ( exception ) {
			this.instructionset = null;
			this.errormessage = exception.message;
			return this._tofallbackstring ( 
				body, params, exception.message 
			);
		}
	}

	/**
	 * Wrap compiled function in boilerplate stuff that 
	 * allows the function to "bind" to a given {edb.Out} 
	 * depending on the type of arguments provided.
	 * @param {String} js
	 * @returns {String}
	 */
	_wraparound ( js ) {
		js = js.replace ( /^function anonymous/, "function $function" );
		js = Result.WRAPPER.replace ( "function $function() {}", js );
		js = js.replace ( /\&quot;\&apos;/g, "&quot;" );
		return js;
	}

	/**
	 * Fallback for invalid source.
	 * @param {String} script
	 * @param (Array<String>} params
	 * @returns {String}
	 */
	_tofallbackstring ( body, params, exception ) {
		body = this._emergencyformat ( body, params );
		body = new Buffer ( body ).toString ( "base64" );
		body = "gui.BlobLoader.loadScript ( document, atob (  '" + body + "' ));\n";
		body += "return '<p class=\"edberror\">" + exception + "</p>'";
		return this._tofunctionstring ( body );
	}

	/**
	 * Format invalid source for readability.
	 * @param {String} body
	 * @returns {String}
	 */
	_emergencyformat ( body, params ) {
		var result = "",
			tabs = "\t",
			init = null,
			last = null,
			fixt = null,
			hack = null;
		body.split ( "\n" ).forEach (( line ) => {
			line = line.trim ();
			init = line [ 0 ];
			last = line [ line.length - 1 ];
			fixt = line.split ( "//" )[ 0 ].trim ();
			hack = fixt [ fixt.length - 1 ];
			if (( init === "}" || init === "]" ) && tabs !== "" ) {
				tabs = tabs.slice ( 0, -1 );
			}
			result += tabs + line + "\n";
			if ( last === "{" || last === "[" || hack === "{" || hack === "[" ) {
				tabs += "\t";
			}			
		});
		return [ 
			"function dysfunction (" + params + ") {",
			result,
			"}" 
		].join ( "\n" );
	}
}

/**
 * Let's declare a boilerplate to wrap around compiled functions.
 * This looks like a function but is really a string declaration. 
 * @type {String}
 */
Result.WRAPPER = ( function () {
	var wrapper = function () {
		( function () {
			'use strict';
			var out;
			function $function() {}
			return function ( $in ) {
				if ( $in && $in.$out ) {
					return function () {
						out = $in.$out;
						return $function.apply ( this, arguments );
					};
				} else {
					out = new edb.Out ();
					return $function.apply ( this, arguments );
				}
			};
		}());
	}.toString ();
	return wrapper.substring ( 
		wrapper.indexOf ( "{" ) + 1, 
		wrapper.lastIndexOf ( "}" )
	).trim ().slice ( 0, -1 );
}());
