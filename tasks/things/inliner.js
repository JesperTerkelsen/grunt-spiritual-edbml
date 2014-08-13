'use strict';

var cheerio = require ( 'cheerio' );
var chalk = require('chalk');
var compiler = require ( './compiler' );
var formatter = require ( './formatter' );
var assistant = require ( './assistant' );
var path = require('path');

/**
 * @param {Grunt} grunt
 * @param {Map<String,String>} files
 * @param {Map<String,String>} options
 * @param {function} done
 */
exports.process = function ( grunt, files, options, done ) {
	var dest, isExpandedPair;	
	files.forEach(function(filePair) {
		isExpandedPair = filePair.orig.expand || false;
		filePair.src.forEach(function(src) {
			if (detectDestType(grunt, filePair.dest) === 'directory') {
				dest = (isExpandedPair) ? filePair.dest : unixifyPath(path.join(filePair.dest, src));
			} else {
				dest = filePair.dest;
			}
			dest = rename(dest, options);
			if(src !== dest) {
				spastiker(grunt, src, dest, options);
			} else {
				grunt.log.error('Src and dest conflict', src, dest);
			}
		});
	});
	done();
};


// Private .....................................................................

function detectDestType(grunt, dest) {
	if (grunt.util._.endsWith(dest, '/')) {
		return 'directory';
	} else {
		return 'file';
	}
}


function unixifyPath(filepath) {
	if (false) { //process.platform === 'win32'
		return filepath.replace(/\\/g, '/');
	} else {
		return filepath;
	}
}

/**
 * @param {Grunt} grunt
 * @param {string} src
 * @param {Map} options
 * @returns {string}
 */
function spastiker(grunt, src, dest, options) {
	var txt = pikodder(grunt, src, options);
	txt = options.process ? options.process(txt, src, dest) : txt;
	grunt.file.write(dest, txt);
	grunt.log.writeln ( 'File "' + chalk.cyan(dest) + '" created.' );
}

/**
 * @param {Grunt} grunt
 * @param {string} src
 * @param {Map} options
 * @returns {string}
 */
function pikodder(grunt, src, options) {
	var txt = grunt.file.read ( src );
	var holders = {}, $ = cheerio.load ( txt );
	$ ( 'script' ).each ( function ( i, script ) {
		script = $ ( script );
		if ( script.attr ( 'type' ) === 'text/edbml' ) {
			var id = script.attr ( 'id' );
			var key = id || assistant.unique ( src, i );
			var tab = tabbing ( script );
			holders [ key ] = convertinline ( 
				script, options, key, tab, id
			);
		}
	});
	if ( Object.keys ( holders ).length ) {
		return resolve ( $.html (), holders );
	} else {
		return $.html ();
	}
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
	var scriptid = id || ('edb.' + key); // TODO: is this right (with the id)?
	var result = compiler.compile ( script.html (), dirs ); // 'edb' + key
	js = assistant.declare ( scriptid, result );
	js = options.beautify ? formatter.beautify ( js, tab, true ) : formatter.uglify ( js );
	script.html ( placeholder ( key )).removeAttr ( 'type' );
	if(!id) { // TODO: should gui.scriptid always be present? Think about this!
		script.addClass ( 'gui-script' );
		script.attr ( 'gui.scriptid', scriptid );
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
	var base = filepath.substr ( 0, filepath.lastIndexOf ( '.' ));
	return base + ( options.extname || '.html' );
}

/**
 * Generate placeholder syntax for key.
 * @param {String} key
 * @returns {String}
 */
function placeholder ( key ) {
	return '${' + key + '}';
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
		return data.replace ( /\n/g, '' );
	} 
	return '';
}

/**
 * Rename it.
 * @param {String} js
 * @param @optional {String} name
 * @returns {String}
 *
function namedfunction ( js, name ) {
	return js.replace ( /^function/, 'function ' + ( name || '' ));
}
*/