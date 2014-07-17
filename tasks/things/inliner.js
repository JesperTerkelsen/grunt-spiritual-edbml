"use strict";

var cheerio = require ( "cheerio" );
var compiler = require ( "./compiler" );
var formatter = require ( "./formatter" );
var assistant = require ( "./assistant" );

/**
 * @param {Grunt} grunt
 * @param {Map<String,String>} files
 * @param {Map<String,String>} options
 */
exports.process = function ( grunt, files, options ) {
	errors = false;
	if ( Array.isArray ( files )) {
		var sources = grunt.file.expand ( files );
		var results = trawlinline ( grunt, sources, options );
		if ( !errors ) {
			Object.keys ( results ).forEach ( function ( src ) {
				var file = rename ( src, options );
				var text = results [ src ];
				grunt.file.write ( file, text );
				grunt.log.writeln ( "File \"" + file + "\" created." );
			});
		}
	} else {
		grunt.log.error ( "Array expected" );
	}
};


// Private ...................................................

/**
 * @todo COPY-PASTE!
 * Flip to abort file system updates.
 * @type {boolean}
 */
var errors = false;

/**
 * @todo COPY-PASTE!
 * @param {String} message
 *
function error ( message ) {
	//grunt.log.error ( message );
	console.error ( message );
	errors = true;
}
*/

/**
 *
 */
function trawlinline ( grunt, sources, options ) {
	var results = {};
	sources.forEach ( function ( src ) {
		var txt = grunt.file.read ( src );
		var holders = {}, $ = cheerio.load ( txt );
		$ ( "script" ).each ( function ( i, script ) {
			script = $ ( script );
			if ( script.attr ( "type" ) === "text/edbml" ) {
				var id = script.attr ( "id" );
				var key = id || assistant.unique ( src, i );
				var tab = tabbing ( script );
				holders [ key ] = convertinline ( 
					script, options, key, tab, id
				);
			}
		});
		if ( Object.keys ( holders ).length ) {
			results [ src ] = resolve ( $.html (), holders );
		} else {
			results [ src ] = $.html ();
		}
	});
	return results;
}

/**
 * Bypass dysfunction in Cheerio that would HTML-encode the JS.
 * @param {String} html
 * @param {Map<String,String>} holders
 * @returns {String}
 */
function resolve ( html, holders ) {
	Object.keys ( holders ).forEach ( function ( key ) {
		html = html.replace ( placeholder ( key ), holders [ key ]);
	});
	return html;
}

/**
 * @param {$} script
 * @param {Map} options
 */
function convertinline ( script, options, key, tab, id ) {
	var js, dirs = assistant.directives ( script );
	var scriptid = id || ("edb." + key); // TODO: is this right (with the id)?
	var result = compiler.compile ( script.html (), dirs ); // "edb" + key
	js = assistant.declare ( scriptid, result );
	js = options.beautify ? formatter.beautify ( js, tab, true ) : formatter.uglify ( js );
	script.html ( placeholder ( key )).removeAttr ( "type" );
	if(!id) { // TODO: should gui.scriptid always be present? Think about this!
		script.addClass ( "gui-script" );
		script.attr ( "gui.scriptid", scriptid );
	}
	return js;
}

/**
 * Change extension of file and return new path.
 * @param {String} filepath
 * @param {Map} options
 * @returns {String}
 */
function rename ( filepath, options ) {
	var base = filepath.substr ( 0, filepath.lastIndexOf ( "." ));
	return base + ( options.extname || ".html" );
}

/**
 * Generate placeholder syntax for key.
 * @param {String} key
 * @returns {String}
 */
function placeholder ( key ) {
	return "${" + key + "}";
}

/**
 * Preserve some indentation in output.
 * @TODO: double check whitespace only.
 * @param {$} script
 * @returns {String}
 */
function tabbing ( script ) {
	var prev, data;
	script = script [ 0 ];
	if (( prev = script.prev ) && ( data = prev.data )) {
		return data.replace ( /\n/g, "" );
	} 
	return "";
}

/**
 * Rename it.
 * @param {String} js
 * @param @optional {String} name
 * @returns {String}
 *
function namedfunction ( js, name ) {
	return js.replace ( /^function/, "function " + ( name || "" ));
}
*/
