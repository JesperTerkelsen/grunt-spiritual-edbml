"use strict";

/**
 * Object.create with default property descriptors. 
 * @see http://wiki.ecmascript.org/doku.php?id=strawman:define_properties_operator
 * @param {object} proto
 * @param {object} props
 *
function extend ( proto, props ) {
	var resolved = Object.create ( null );
	Object.keys ( props ).forEach ( function ( prop ) {
		resolved [ prop ] = {
			value : props [ prop ],
			writable : true,
			enumerable : true,
			configurable : true
		};
	});
	return Object.create ( proto, resolved );
}
*/

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
 * @deprecated
 * Generate probable unique key.
 * @returns {String}
 *
function unique () {
	var ran = String ( Math.random ());
	return "key" + ran.slice ( 2, 11 );
}
*/

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
