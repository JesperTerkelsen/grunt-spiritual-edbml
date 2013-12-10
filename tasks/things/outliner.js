var cheerio = require ( "cheerio" );
var compiler = require ( "./compiler" );
var formatter = require ( "./formatter" );
var assistant = require ( "./assistant" );
var path = require ( "path" );

/**
 * Concat and minify files.
 * @param {Grunt} grunt
 * @param {Map<String,String} files
 * @param {Map<String,String} options
 */
exports.process = function ( grunt, files, options ) {
	errors = false;
	if ( !Array.isArray ( files )) {
		Object.keys ( files ).forEach ( function ( target ) {
			var sources = grunt.file.expand ( files [ target ]);
			var results = trawloutline ( grunt, sources, options );
			if ( results.length && !errors ) {
				grunt.file.write ( target, formatter.beautify ( results ));
				grunt.log.writeln ( "Generated " + target );
			}
		});
	} else {
		grunt.log.error ( "Object expected" );
	}
};


// Private ...............................................................................

/**
 * Match something that can be used as a function or variable name (no weirdo dashes etc).
 * http://stackoverflow.com/questions/2008279/validate-a-javascript-function-name/2008444#2008444
 * @type {RegExp}
 */
var IDENTIFIER = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/;

/**
 * @todo COPY-PASTE!
 * Flip to abort file system updates.
 * @type {boolean}
 */
var errors = false;

/**
 * @todo COPY-PASTE!
 * @param {String} message
 */
function error ( message ) {
	grunt.log.error ( message );
	errors = true;
}

/**
 * @returns {Array<Output>}
 * @returns {String}
 */
function trawloutline ( grunt, sources ) {
	var results = [];
	sources.forEach ( function ( src ) {
		var $ = cheerio.load ( grunt.file.read ( src ));
		getscripts ( $, src ).each ( function ( i, script ) {
			results.push ( 
				parse ( $ ( script ), assistant.unique ( src, i ))
			);
		});
	});
	return results.join ( "\n\n" );
}

/**
 * @returns {$}
 */
function getscripts ( $, src ) {
	var scripts = $ ( "script" );
	if ( scripts.length === 1 ) {
		var name, script = $ ( scripts [ 0 ]);
		if ( !script.attr ( "id" )) {
			name = path.basename ( src );
			if ( validname ( name )) {
				script.attr ( "id", name );
			} else {
				error ( "File name unfit for declaration as a JS object: " + name );	
			}
		}
	} else {
		if ( !Array.prototype.every.call ( scripts, function ( script ) {
			return $ ( script ).attr ( "id" );
		})) {
			error ( "ID required when multiples script in file: " + src );
		}
	}
	return scripts;
}

/**
 * @param {String} name
 * @returns {boolean}
 */
function validname ( name ) {
	name = name.replace ( /\./g, "" );
	return name.match ( IDENTIFIER ) ? true : false;
}

/**
 * Parse single script.
 * @param {$} script
 * @returns {String}
 */
function parse ( script, key ) {
	var name = script.attr ( "id" );
	var text = script.text ();
	var atts = assistant.directives ( script );
	return compile ( name, text, atts, key );
}

/**
 * Compile EDBML to JS with directives.
 * @param {String} name
 * @param {String} edbml
 * @param {Map<String,object>} options
 */
function compile ( name, edbml, options, key ) {
	var result = compiler.compile ( edbml, options, key );
	return declare ( name, result );
}

/**
 * Produce JS declarations.
 * @param {String} name
 * @param {String} name
 * @returns {String}
 */
function declare ( name, result ) {
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
}
