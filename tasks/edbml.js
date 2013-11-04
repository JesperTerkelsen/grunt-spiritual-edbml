var cheerio = require ( "cheerio" );
var beautyfier = require ( "esformatter" );
var uglifier = require ( "uglify-js" );
var compiler = require ( "./compiler" );
var shorthash = require ( "./shorthash" );
var path = require ( "path" );

/**
 * Here it comes.
 * @param {Grunt} grunt
 */
module.exports = function ( grunt ) {

	"use strict";

	/**
	 * Match something that can be used as a function or variable name.
	 * http://stackoverflow.com/questions/2008279/validate-a-javascript-function-name/2008444#2008444
	 * @type {RegExp}
	 */
	var IDENTIFIER = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/;

	/**
	 * Flip to abort file system updates.
	 * @type {boolean}
	 */
	var errors = false;

	/**
	 * Throw up.
	 * @param {String} message
	 */
	function error ( message ) {
		grunt.log.error ( message );
		errors = true;
	}

	/**
	 * Genereate hash for file name.
	 * @param {String} string
	 * @returns {String}
	 */
	function unique ( filepath, index ) {
		return "$" + shorthash.unique ( filepath ) + index;
	}

	/**
	 * Yeah.
	 */
	grunt.registerMultiTask ( "edbml", "Trawl EDBML", function () {
		errors = false;
		var options = this.options ();
		if ( options.inline ) {
			processinline ( this.data.src, options );
		} else {
			processoutline ( this.data.files, options );
		}
	});

	/**
	 * @TODO: this outputs nothing if no SCRIPT tags found :/
	 * @param {Array<String>} files
	 * @param {Map} options
	 */
	function processinline ( files, options ) {
		if ( Array.isArray ( files )) {
			var sources = grunt.file.expand ( files );
			var results = trawlinline ( sources, options );
			if ( !errors ) {
				Object.keys ( results ).forEach ( function ( src ) {
					var file = rename ( src, options );
					grunt.file.write ( file, results [ src ]);
					grunt.log.writeln ( "Generated " + file );
				});
			}
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
				if ( results.length && !errors ) {
					grunt.file.write ( target, beautify ( results ));
					grunt.log.writeln ( "Generated " + target );
				}
			});
		} else {
			grunt.log.error ( "Object expected" );
		}
	}

	/**
	 * @returns {Array<Output>}
	 * @returns {String}
	 */
	function trawloutline ( sources ) {
		var results = [];
		sources.forEach ( function ( src ) {
			var $ = cheerio.load ( grunt.file.read ( src ));
			getscripts ( $, src ).each ( function ( i, script ) {
				results.push ( parse ( $ ( script ), unique ( src, i )));
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
			if ( !Array.every ( scripts, function ( script ) {
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
						var tab = tabbing ( script );
						var key = unique ( src, i );
						holders [ key ] = convertinline ( 
							script, options, key, tab
						);
					}
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
	function convertinline ( script, options, key, tab ) {
		var js, dirs = directives ( script, { script : true });
		var result = compiler.compile ( script.html (), dirs, key );
		var pis = result.instructions;
		js = named ( result.js, key );
		js += pis ? key + ".$instructions = " + JSON.stringify ( pis ) + ";" : "";
		js = options.beautify ? beautify ( js, tab, true ) : uglify ( js );
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
	function parse ( script, key ) {
		var name = script.attr ( "id" );
		var text = script.text ();
		var atts = directives ( script );
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
		var runner = named ( result.js );
		var pis = result.instructions;
		var output = "gui.Object.assert ( \"" + name + "\", " + runner + ");";
		if ( pis ) {
			pis = JSON.stringify ( pis );
			output += "gui.Object.assert ( \"" + name + ".$instructions\", " + pis + ");";	
		}
		return output;
	}

	/**
	 * Format JS for readability.
	 * @param {String} js
	 * @returns {String}
	 */
	function beautify ( js, tab, buffer ) {
		tab = tab || "";
		js = beautyfier.format ( js, beautyoptions ());
		js = js.split ( "\n" ).filter ( function ( line, i ) {
			return line.trim ().length;
		}).map ( function ( line ) {
			return tab + line;
		}).join ( "\n" );
		return buffer ? "\n" + js + "\n" + tab : js;
	}

	/**
	 * ES formatter options. Work in progress.
	 * @returns {object}
	 */
	function beautyoptions () {
		return {
			preset : "default",
			indent : {
				value : "\t",
				ChainedMemberExpression : 0
			},
			lineBreak : {
				keepEmptyLines : 0,
				before : {
					VariableName : 0
				}
			}
		};
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