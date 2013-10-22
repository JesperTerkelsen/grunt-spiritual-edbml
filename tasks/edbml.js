var cheerio = require ( "cheerio" );
var beautyfier = require ( "esformatter" );
var uglifier = require ( "uglify-js" );
var compiler = require ( "./compiler" );

/**
 * Here it comes.
 * @param {Grunt} grunt
 */
module.exports = function ( grunt ) {

	"use strict";

	/**
	 * Yeah.
	 */
	grunt.registerMultiTask ( "edbml", "Trawl EDBML", function () {
		var options = this.options ();
		if ( options.inline ) {
			processinline ( this.data.src, options );
		} else {
			processoutline ( this.data.files, options );
		}
	});

	/**
	 * @param {Array<String>} files
	 * @param {Map} options
	 */
	function processinline ( files, options ) {
		if ( Array.isArray ( files )) {
			var sources = grunt.file.expand ( files );
			var results = trawlinline ( sources, options );
			Object.keys ( results ).forEach ( function ( src ) {
				var file = rename ( src, options );
				grunt.file.write ( file, results [ src ]);
				grunt.log.writeln ( "Generated " + file );
			});
		} else {
			grunt.log.error ( "Array expected" );
		}
	}

	/** 
	 * Concat and minify files.
	 * @param {Map<String,String} files
	 * @param {Map<String,String} options
	 */
	function processoutline ( files, options ) {
		if ( !Array.isArray ( files )) {
			Object.keys ( files ).forEach ( function ( target ) {
				var sources = grunt.file.expand ( files [ target ]);
				var results = trawloutline ( sources, options );
				grunt.file.write ( target, beautify ( results ));
				grunt.log.writeln ( "Generated " + target );
			});
		} else {
			grunt.log.error ( "Object expected" );
		}
	}

	/**
	 * @returns {Array<FunctionResult>}
	 * @returns {String}
	 */
	function trawloutline ( sources ) {
		var results = [];
		sources.forEach ( function ( src ) {
			src = grunt.file.read ( src );
			var $ = cheerio.load ( src );
			$ ( "script" ).each ( function ( i, script ) {
				script = $ ( script );
				if ( script.attr ( "id" )) {
					results.push ( parse ( script ));
				}
			});
		});
		return results.join ( "\n\n" );
	}

	/**
	 *
	 */
	function trawlinline ( sources, options ) {
		var results = {};
		sources.forEach ( function ( src ) {
			var txt = grunt.file.read ( src );
			var holders = {}, $ = cheerio.load ( txt );
			$ ( "script" ).each ( function ( i, script ) {
				script = $ ( script );
				if ( script.attr ( "type" ) === "text/edbml" ) {
					if ( script.attr ( "id" )) {
						script.replaceWith ( "<h1>TODO!<h1>" );
					} else {
						var key = unique ();
						holders [ key ] = convertinline ( 
							script, options, key
						);
					}
				}
			});
			if ( Object.keys ( holders ).length ) {
				results [ src ] = resolve ( $.html (), holders );
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
	function convertinline ( script, options, key ) {
		var js, dirs = directives ( script, { script : true });
		var result = compiler.compile ( script.html (), dirs );
		var inputs = result.inputs;
		js = named ( result.js, key );
		js += inputs ? key + ".$input = " + JSON.stringify ( inputs ) + ";" : "";
		js = options.beautify ? beautify ( js, true ) : uglify ( js );
		script.html ( placeholder ( key )).
			addClass ( "gui-script" ).
			attr ( "gui.id", key ).
			removeAttr ( "type" );
		return js;
	}

	/**
	 * Unname function "anonymous", optionally rename it.
	 * @param {String} js
	 * @param @optional {String} name
	 * @returns {String}
	 */
	function named ( js, name ) {
		return js.replace ( /^function anonymous/, "function " + ( name || "" ));
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
	 * @param {$} script
	 * @param @optional {Map} extras
	 * @returns {Map<String,object>}
	 */
	function directives ( script, extras ) {
		var map = {};
		Object.keys ( script [ 0 ].attribs ).forEach ( function ( key ) {
			map [ key ] = cast ( map [ key ]);
		});
		Object.keys ( extras || {}).forEach ( function ( key ) { 
			map [ key ] = extras [ key ];
		});
		return map;
	}

	/**
	 * Parse single script.
	 * @param {$} script
	 * @returns {String}
	 */
	function parse ( script ) {
		var name = script.attr ( "id" );
		var text = script.text ();
		var atts = directives ( script );
		return compile ( name, text, atts );
	}

	/**
	 * Compile EDBML to JS with directives.
	 * @param {String} name
	 * @param {String} edbml
	 * @param {Map<String,object>} options
	 */
	function compile ( name, edbml, options ) {
		var result = compiler.compile ( edbml, options );
		return declare ( name, result );
	}

	/**
	 * Produce JS declarations.
	 * @param {String} name
	 * @param {String} name
	 * @returns {String}
	 */
	function declare ( name, result ) {
		var runner = named ( result.js );
		var inputs = result.inputs;
		var output = "gui.Object.assert ( \"" + name + "\", " + runner + ");";
		if ( inputs ) {
			inputs = JSON.stringify ( inputs );
			output += "gui.Object.assert ( \"" + name + ".$input\", " + inputs + ");";
		}
		return output;
	}

	/**
	 * Format JS for readability.
	 * @param {String} js
	 * @returns {String}
	 */
	function beautify ( js, buffer ) {
		js = beautyfier.format ( js, {
			preset : "default",
			indent : { value : "\t" }
		});
		return buffer ? "\n" + js + "\n" : js;
	}

	/**
	 * Compute compressed source for file.
	 * @param {String} filepath The file path
	 * @returns {String}
	 */
	function uglify ( js ) {
		return uglifier.minify ( js, {
			fromString : true,
			compress: {
        warnings: false
      }
    }).code;
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
	 * Generate probable unique key.
	 * @returns {String}
	 */
	function unique () {
		var ran = String ( Math.random ());
		return "key" + ran.slice ( 2, 11 );
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
};