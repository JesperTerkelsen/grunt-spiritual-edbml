var cheerio = require ( "cheerio" );
var formatter = require ( "esformatter" );
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
		process ( this.data.files, this.options ());
	});

	/** 
	 * Concat and minify files.
	 * @param {Map<String,String} files
	 * @param {Map<String,String} options
	 */
	function process ( files, options ) {
		Object.keys ( files ).forEach ( function ( target ) {
			var sources = grunt.file.expand ( files [ target ]);
			var results = trawl ( sources ).join ( "\n\n" );
			grunt.file.write ( target, format ( results ));
			grunt.log.writeln ( "Generated " + target );
		});
	}

	/**
	 * @returns {Array<FunctionResult>}
	 * @returns {Array<Strring>}
	 */
	function trawl ( sources ) {
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
		return results;
	}

	/**
	 * Parse single script.
	 * @param {$} script
	 * @returns {String}
	 */
	function parse ( script ) {
		var name = script.attr ( "id" );
		var text = script.text ();
		var atts = script [ 0 ].attribs;
		return compile ( name, text, atts );
	}

	/**
	 * Compile EDBML to JS with directives.
	 * @param {String} name
	 * @param {String} edbml
	 * @param {Map<String,String>} atts
	 */
	function compile ( name, edbml, atts ) {
		var options = castall ( atts );
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
		var runner = result.runnable;
		var inputs = JSON.stringify ( result.inputs );
		var output = "gui.Object.assert ( \"" + name + "\", " + runner + ");";
		if ( inputs ) {
			output += "gui.Object.assert ( \"" + name + ".$input\", " + inputs + ");";
		}
		return output;
	}

	/**
	 * Format JS for readability.
	 * @param {String} js
	 * @returns {String}
	 */
	function format ( js ) {
		return formatter.format ( js, {
			preset : "default",
			indent : { value : "\t" }
		});
	}

	/**
	 * Cast map values to inferred types.
	 * @param {Map<String,String>} map
	 * @returns {Map<String,object>}
	 */
	function castall ( map ) {
		Object.keys ( map ).forEach ( function ( key ) {
			map [ key ] = castone ( map [ key ]);
		});
		return map;
	}

	/**
	 * Autocast string to an inferred type. "123" will 
	 * return a number, "false" will return a boolean.
	 * @param {String} string
	 * @returns {object}
	 */
	function castone ( string ) {
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
};