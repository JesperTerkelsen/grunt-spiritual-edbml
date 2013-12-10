var beautyfier = require ( "esformatter" );
var uglifier = require ( "uglify-js" );

/**
 * Format JS for readability.
 * @param {String} js
 * @returns {String}
 */
exports.beautify = function ( js, tab, buffer ) {
	tab = tab || "";
	js = beautyfier.format ( js, beautyoptions ());
	js = js.split ( "\n" ).filter ( function ( line, i ) {
		return line.trim ().length;
	}).map ( function ( line ) {
		return tab + line;
	}).join ( "\n" );
	return buffer ? "\n" + js + "\n" + tab : js;
};

/**
 * Compute compressed source for file.
 * @param {String} filepath The file path
 * @returns {String}
 */
exports.uglify = function ( js ) {
	return uglifier.minify ( js, {
		fromString : true,
		compress: {
      warnings: false
    }
  }).code;
}


// Private ...............................

/**
 * ES formatter options. Work in progress.
 * @returns {object}
 */
function beautyoptions () {
	return {
		preset : "default",
		indent : {
			value : "\t"
		},
		lineBreak : {
			keepEmptyLines : 0
		}
	};
}
