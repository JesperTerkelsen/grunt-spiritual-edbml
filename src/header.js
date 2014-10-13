"use strict";

/**
 * Call function for each own key in object (exluding the prototype stuff) 
 * with key and value as arguments. Returns array of function call results.
 * @param {object} object
 * @param {function} func
 * @param @optional {object} thisp
 */
function each ( object, func, thisp ) {
	return Object.keys ( object ).map (( key ) => {
		return func.call ( thisp, key, object [ key ]);
	});
}

/**
 * Autocast string to an inferred type. "123" returns a number 
 * while "true" and false" return a boolean. Empty string evals 
 * to `true` in order to support HTML attribute minimization.
 * @param {String} string
 * @returns {object}
 */
function cast ( string ) {
	var result = String ( string );
	switch ( result ) {
		case "null" :
			result = null;
			break;
		case "true" :
		case "false" :
			result = ( result === "true" );
			break;
		default :
			if ( String ( parseInt ( result, 10 )) === result ) {
				result = parseInt ( result, 10 );
			} else if ( String ( parseFloat ( result )) === result ) {
				result = parseFloat ( result );
			}
			break;	
	}
	return result === "" ? true : result;
}

/**
 * Generate unique key.
 * Note: Key structure must be kept in sync with {gui.KeyMaster#generatekey}.
 * @returns {String}
 */
var generateKey = ( function () {
	var keys = {};
	return function () {
		var ran = Math.random ().toString ();
		var key = "key" + ran.slice ( 2, 11 );
		if ( keys [ key ]) {
			key = generateKey ();
		} else {
			keys [ key ] = true;
		}
		return key;
	};
}());

/**
 * What? This is wrong on so many.
 * @param {string} string
 * @returns {boolean}
 */
String.prototype.contains = function (string) {
	return this.indexOf(string) > -1;
};

/**
 * Come on.
 * @param {string} string
 * @returns {boolean}
 */
String.prototype.startsWith = function (string) {
	return this.indexOf(string) === 0;
};

/**
 * Again? That's it. Good luck.
 * @param {string} string
 * @returns {boolean}
 */
String.prototype.endsWith = function (string) {
	return this.indexOf(string) === this.length - 1;
};
