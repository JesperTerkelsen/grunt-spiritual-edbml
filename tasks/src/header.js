"use strict";

/**
 * Object.create with default property descriptors. 
 * @see http://wiki.ecmascript.org/doku.php?id=strawman:define_properties_operator
 * @param {object} proto
 * @param {object} props
 */
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

/**
 * Call function for each own key in object (exluding the prototype stuff) 
 * with key and value as arguments. Returns array of function call results.
 * @param {object} object
 * @param {function} func
 * @param @optional {object} thisp
 */
function each ( object, func, thisp ) {
	return Object.keys ( object ).map ( function ( key ) {
		return func.call ( thisp, key, object [ key ]);
	});
}

/**
 * Generate probable unique key.
 * @returns {String}
 */
function unique () {
	var ran = String ( Math.random ());
	return "key" + ran.slice ( 2, 11 );
}