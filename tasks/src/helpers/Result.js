"use strict";

/**
 * Collecting compiler result.
 * @param @optional {String} body
 */
function Result ( body ) {
	this.body = body || "";
}

Result.prototype = {

	/**
	 * Main result string.
	 * @type {String}
	 */
	body : null,

	/**
	 * Temp string buffer.
	 * @type {String}
	 */
	temp : null,

	/**
	 * Format result for readability.
	 * @returns {String}
	 */
	format : function () {
		return Result.format ( this.body );
	}
};

/**
 * @deprecated
 * Format JS for readability.
 * @TODO Indent switch cases
 * @TODO Remove blank lines
 * @param {String} body
 * @returns {String}
 */
Result.format = function ( body ) {
	return body;
	/*
	var result = "",
		tabs = "\t",
		init = null,
		last = null,
		fixt = null,
		hack = null;
	body.split ( "\n" ).forEach ( function ( line ) {
		line = line.trim ();
		init = line.charAt ( 0 );
		last = line.charAt ( line.length - 1 );
		fixt = line.split ( "//" )[ 0 ].trim ();
		hack = fixt.charAt ( fixt.length - 1 );
		if (( init === "}" || init === "]" ) && tabs !== "" ) {				
			tabs = tabs.slice ( 0, -1 );
		}
		result += tabs + line + "\n";
		if ( last === "{" || last === "[" || hack === "{" || hack === "[" ) {
			tabs += "\t";
		}
	});
	return result;
	*/
};