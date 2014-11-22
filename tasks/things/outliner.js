"use strict";

var cheerio = require("cheerio");
var chalk = require('chalk');
var compiler = require("./compiler");
var formatter = require("./formatter");
var assistant = require("./assistant");
var path = require("path");

/**
 * Concat and minify files.
 * @param {Grunt} grunt
 * @param {Map<String,String} files
 * @param {Map<String,String} options
 * @param {function} done
 */
exports.process = function(grunt, files, options, macros, done) {
	errors = false;
	if (!Array.isArray(files)) {
		Object.keys(files).forEach(function(target) {
			var sources = grunt.file.expand(files[target]);
			var results = trawloutline(grunt, sources, options, macros);
			if (results.length && !errors) {
				//var text = formatter.beautify(results);
				target = grunt.template.process(target);
				grunt.file.write(target, results);
				grunt.log.writeln("File " + chalk.cyan(target) + ' created.');
			}
		});
		done();
	} else {
		grunt.log.error("Object expected");
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
 * @param {string} message
 */
function error(message) {
	//grunt.log.error ( message );
	console.error(message);
	errors = true;
}

/**
 * @returns {Array<Output>}
 * @returns {string}
 */
function trawloutline(grunt, sources, options, macros) {
	var results = [];
	sources.forEach(function(src) {
		var $ = cheerio.load(grunt.file.read(src));
		getscripts($, src, options).each(function(i, script) {
			var js = parse($(script), options, macros);
			results.push(comment(src) + formatter.beautify(js));
		});
	});
	return results.join("\n\n"); // beautfier will strip this :/
}

/**
 * @returns {$}
 */
function getscripts($, src) {
	var scripts = $("script");
	if (scripts.length === 1) {
		var name, script = $(scripts[0]);
		if (!script.attr("id")) {
			name = path.basename(src);
			if (validname(name)) {
				script.attr("id", name);
			} else {
				error("File name unfit for declaration as a JS object: " + name);
			}
		}
	} else {
		if (!Array.prototype.every.call(scripts, function(script) {
			return $(script).attr("id");
		})) {
			error("ID required when multiples script in file: " + src);
		}
	}
	return scripts;
}

/**
 * @param {string} name
 * @returns {boolean}
 */
function validname(name) {
	name = name.replace(/\./g, "");
	return name.match(IDENTIFIER) ? true : false;
}

/**
 * Parse single script.
 * @param {$} script
 * @param {???} macros
 * @returns {string}
 */
function parse(script, options, macros) {
	var name = script.attr("id");
	var text = script.text();
	var atts = assistant.directives(script);
	return compile(name, text, options, macros, atts);
}

/**
 * Compile EDBML to JS with directives.
 * @param {string} name
 * @param {string} edbml
 * @param {Map<string,object>} options
 * @param {Map<string,object>} options
 */
function compile(name, edbml, options, macros, directives) {
	var result = compiler.compile(edbml, options, macros, directives);
	return assistant.declare(name, result);
}

/**
 * Stamp the EDBML src into a comment.
 * @param {string} src
 * @returns {string}
 */
function comment(src) {
	return '// ' + src + '\n';
}
