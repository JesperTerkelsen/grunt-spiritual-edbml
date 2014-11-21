"use strict";

/**
 * Script runner. Iterating strings one character at a time
 * while using advanced algorithms to look ahead and behind.
 */
class Runner {

	/**
	 * Let's go.
	 */
	constructor() {
		this.firstline = false;
		this.lastline = false;
		this.firstchar = false;
		this.lastchar = false;
		this._line = null;
		this._index = -1;
	}

	/**
	 * Run script.
	 * @param {Compiler} compiler
	 * @param {string} script
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 */
	run(compiler, script, status, markup, output) {
		this._runlines(compiler, script.split("\n"), status, markup, output);
		// markup.debug(); // uncomment to debug Markup.js
	}

	/**
	 * Line text ahead equals given string?
	 * @param {string} string
	 * @returns {boolean}
	 */
	ahead(string) {
		var line = this._line;
		var index = this._index;
		var i = index + 1;
		var l = string.length;
		return line.length > index + l && line.substring(i, i + l) === string;
	}

	/**
	 * Line text behind equals given string?
	 * @param {string} line
	 * @param {number} index
	 * @param {string} string
	 * @returns {boolean}
	 */
	behind(string) {
		var line = this._line;
		var index = this._index;
		var length = string.length,
			start = index - length;
		return start >= 0 && line.substr(start, length) === string;
	}

	/**
	 * Get line string from current position.
	 * @returns {string}
	 */
	lineahead() {
		return this._line.substring(this._index + 1);
	}

	/**
	 * Space-stripped line text at index equals string?
	 * @param {string} string
	 * @returns {boolean}
	 */
	skipahead(string) {
		console.error("TODO");
	}


	// Private ...................................................................

	/**
	 * Run all lines.
	 * @param {Compiler} compiler
	 * @param {Array<String>} lines
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 */
	_runlines(compiler, lines, status, markup, output) {
		var stop = lines.length - 1;
		lines.forEach((line, index) => {
			this.firstline = index === 0;
			this.lastline = index === stop;
			this._runline(line, index, compiler, status, markup, output);
		});
	}

	/**
	 * Run single line.
	 * @param {string} line
	 * @param {number} index
	 * @param {Compiler} compiler
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 */
	_runline(line, index, compiler, status, markup, output) {
		line = this._line = line.trim();
		if (line.length) {
			compiler.newline(line, this, status, markup, output);
			this._runchars(compiler, line.split(""), status, markup, output);
			compiler.endline(line, this, status, markup, output);
		}
	}

	/**
	 * Run all chars.
	 * @param {Compiler} compiler
	 * @param {Array<String>} chars
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 */
	_runchars(compiler, chars, status, markup, output) {
		var stop = chars.length - 1;
		chars.forEach((c, i) => {
			this._index = i;
			this.firstchar = i === 0;
			this.lastchar = i === stop;
			compiler.nextchar(c, this, status, markup, output);
		});
	}
}
