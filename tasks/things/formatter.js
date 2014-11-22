"use strict";

var beautyfier = require("esformatter");
var uglifier = require("uglify-js");

/**
 * Format JS for readability.
 * @param {string} js
 * @param {string} tab
 * @param {boolean} buffer (boolean?)
 * @returns {string}
 */
exports.beautify = function(js, tab, buffer) {
	tab = tab || '';
	js = beautyfier.format(js, beautyoptions());
	js = js.split('\n').filter(function(line, i) {
		return line.trim().length;
	}).map(function(line) {
		return tab + line;
	}).join('\n');
	js = buffer ? '\n' + js + '\n' + tab : js;
	return simplified(js);
};

/**
 * Compute compressed source for file.
 * @param {string} filepath The file path
 * @returns {string}
 */
exports.uglify = function(js) {
	return uglifier.minify(js, {
		fromString: true,
		compress: {
			warnings: false
		}
	}).code;
};


// Private ...............................

/**
 * ES formatter options. Work in progress.
 * @returns {object}
 */
function beautyoptions() {
	return {
		preset: "default",
		indent: {
			value: "    "
		},
		lineBreak: {
			keepEmptyLines: 0
		}
	};
}

/**
 * Substiture repeated lines of `out.html +=` with simple 
 * `+` concatenation. Watch out for hardcoded strings here.
 * @param {string} js
 * @returns {string}
 */
function simplified(js) {
	var is = false;
	var go = false;
	var here = 'out.html += '; // hardcoced
	var gone = '            '; // hardcoded to equal length
	var fixes = [];
	var lines = js.split('\n').map(function(line, index) {
		go = line.trim().startsWith(here);
		if(is && go) {
			line = line.replace(here, gone);
			fixes.push(index - 1);
		}
		is = go;
		return line;
	});
	fixes.forEach(function(index) {
		if(index > -1) {
			var line = lines[index];
			lines[index] = line.replace(/;$/, ' +');
		}
	});
	return lines.join('\n');
}
