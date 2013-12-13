"use strict";

var shorthash = require ( "./shorthash" );

/**
 * Genereate hash for file name.
 * @param {String} string
 * @returns {String}
 */
exports.unique = function ( filepath, index ) {
	return "$" + shorthash.unique ( filepath ) + index;
};

/**
 * Format script attributes as hashmap.
 * @param {$} script (Cheerio object)
 * @param @optional {Map} extras
 * @returns {Map<String,object>}
 */
exports.directives = function ( script, extras ) {
	var map = {};
	Object.keys ( script [ 0 ].attribs ).forEach ( function ( key ) {
		map [ key ] = autocast ( map [ key ]);
	});
	Object.keys ( extras || {}).forEach ( function ( key ) { 
		map [ key ] = extras [ key ];
	});
	return map;
};

/**
 * Produce JS declarations.
 * @param {String} name
 * @param {String} name
 * @returns {String}
 */
exports.declare = function ( name, result ) {
	var fun = result.functionstring;
	var pis = result.instructionset;
	var output = "edb.declare ( \"" + name + "\" ).as (" + fun;
	if ( pis ) {
		pis = JSON.stringify ( pis );
		output += ").withInstructions (" + pis + ");";
	} else {
		output += ");";
	}
	return output;
};

/**
 * Ouch. Somethings gotta give somewhere.
 * @param {String} text
 * @returns {String}
 */
exports.hotfix = function ( text ) {
	return text.
		replace ( /&quot;&apos;/g, "&quot;'" ).
		replace ( /&apos;&quot;/g, "'&quot;" );
};

/**
 * @todo COPY-PASTE!
 * Autocast string to an inferred type. "123" returns a number 
 * while "true" and false" return a boolean. Empty string evals 
 * to `true` in order to support HTML attribute minimization.
 * @param {String} string
 * @returns {object}
 */
function autocast ( string ) {
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
