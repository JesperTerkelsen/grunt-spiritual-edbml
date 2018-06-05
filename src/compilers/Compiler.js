"use strict";

/**
 * Base compiler.
 * Note to self: Conceptualize peek|poke|geek|passout|lockout
 */
class Compiler {

	/**
	 * Let's go.
	 */
	constructor() {
		this._keycounter = 0;
	}

	/**
	 * Line begins.
	 * @param {string} line
	 * @param {Runner} runner
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 */
	newline(line, runner, status, markup, output) {
		status.last = line.length - 1;
		status.adds = line[0] === "+";
		status.cont = status.cont || (status.ishtml() && status.adds);
	}

	/**
	 * Line ends.
	 * @param {string} line
	 * @param {Runner} runner
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 */
	endline(line, runner, status, markup, output) {
		if (status.ishtml()) {
			if (!status.cont) {
				output.body += "';\n";
				status.gojs();
			}
		} else {
			output.body += "\n";
		}
		status.cont = false;
	}

	/**
	 * Next char.
	 * @param {string} c
	 * @param {Runner} runner
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 */
	nextchar(c, runner, status, markup, output) {
		switch (status.mode) {
			case Status.MODE_JS:
				this._compilejs(c, runner, status, markup, output);
				break;
			case Status.MODE_HTML:
				this._compilehtml(c, runner, status, markup, output);
				break;
		}
		if (status.skip-- <= 0) {
			if (status.poke || status.geek) {
				output.temp += c;
			} else {
				if (!status.istag()) {
					output.body += c;
				}
			}
		}
		if (runner.done) {
			markup.debug();
		}
	}


	// Private ...................................................................

	/**
	 * Compile EDBML source to function body.
	 * @param {string} script
	 * @returns {string}
	 */
	_compile(script) {
		var runner = new Runner();
		var status = new Status();
		var markup = new Markup();
		var output = new Output();
		runner.run(this, script, status, markup, output);
		output.body += (status.ishtml() ? "';" : "") + "\nreturn out.write ();";
		return output.body;
	}

	/**
	 * Compile character as script.
	 * @param {string} c
	 * @param {Runner} runner
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 */
	_compilejs(c, runner, status, markup, output) {
		switch (c) {
			case "<":
				if (runner.firstchar) {
					status.gohtml();
					markup.next(c);
					status.spot = output.body.length - 1;
					output.body += "out.html += '";
				}
				break;
			case "@":
				// handled by the @ macro
				break;
		}
	}

	/**
	 * Compile character as HTML.
	 * @param {string} c
	 * @param {Runner} runner
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 */
	_compilehtml(c, runner, status, markup, output) {
		var special = status.peek || status.poke || status.geek;
		if (!this._continueshtml(c, runner, status)) {
			var context = markup.next(c);
			switch (c) {
				case "{":
					if (special) {
						status.curl++;
					}
					break;
				case "}":
					if (--status.curl === 0) {
						if (status.peek) {
							status.peek = false;
							status.skip = 1;
							status.curl = 0;
							output.body += ") + '";
						}
						if (status.poke) {
							this._poke(status, markup, output);
							status.poke = false;
							output.temp = null;
							status.skip = 1;
							status.curl = 0;
						}
						if (status.geek) {
							this._geek(status, markup, output);
							status.geek = false;
							output.temp = null;
							status.skip = 1;
							status.curl = 0;
						}
					}
					break;
				case "$":
					if (!special && runner.ahead("{")) {
						status.peek = true;
						status.skip = 2;
						status.curl = 0;
						output.body += "' + " + this._escapefrom(context) + " (";
					}
					break;
				case "#":
					if (!special && runner.ahead("{")) {
						status.poke = true;
						status.skip = 2;
						status.curl = 0;
						output.temp = "";
					}
					break;
				case "?":
					if (!special && runner.ahead("{")) {
						status.geek = true;
						status.skip = 2;
						status.curl = 0;
						output.temp = "";
					}
					break;
				case "'":
					if (!special) {
						output.body += "\\";
					}
					break;
				case "@":
					this._htmlatt(runner, status, markup, output);
					break;
			}
		}
	}

	/**
	 * HTML continues on next line or
	 * was continued from previous line?
	 * @param {string} c
	 * @param {Runner} runner
	 * @param {Status} status
	 * @returns {boolean}
	 */
	_continueshtml(c, runner, status) {
		if (c === "+") {
			if (runner.firstchar) {
				status.skip = status.adds ? 1 : 0;
				return true;
			} else if (runner.lastchar) {
				status.cont = true;
				status.skip = 1;
				return true;
			}
		}
		return false;
	}

	/**
	 * Get function to escape potentially
	 * unsafe text in given markup context.
	 * @param {string} context Markup state
	 * @returns {string} Function name
	 */
	_escapefrom(context) {
		switch (context) {
			case Markup.CONTEXT_TXT:
				return '$txt';
			case Markup.CONTEXT_VAL:
				return '$val';
			default:
				return '';
		}
	}

	/**
	 * Parse @ notation in HTML.
	 * @param {Runner} runner
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 */
	_htmlatt(runner, status, markup, output) {
		var attr = Compiler._ATTREXP;
		var rest, name, dels, what;
		if (runner.behind("@")) {} else if (runner.behind("#{")) {
			console.error("todo");
		} else if (runner.ahead("@")) {
			output.body += "' + $att.$all() + '";
			status.skip = 2;
		} else {
			rest = runner.lineahead();
			name = attr.exec(rest)[0];
			dels = runner.behind("-");
			what = dels ? "$att.$pop" : "$att.$";
			output.body = dels ? output.body.substring(0, output.body.length - 1) : output.body;
			output.body += "' + " + what + " ( '" + name + "' ) + '";
			status.skip = name.length + 1;
		}
	}

	/**
	 * Generate $poke at marked spot.
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 */
	_poke(status, markup, output) {
		var tag = markup.tag || '';
		var arg = tag.match(/input|textarea/) ? 'value, checked' : '';
		this._injectcombo(status, markup, output, {
			outline: "var $name = $set(function(" + arg + ") {\n$temp;\n}, this);",
			inline: "edbml.$run(this, \\'\' + $name + \'\\');"
		});
	}

	/**
	 * Generate ?geek at marked spot.
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 */
	_geek(status, markup, output) {
		this._injectcombo(status, markup, output, {
			outline: "var $name = $set(function() {\nreturn $temp;\n}, this);",
			inline: "edbml.$get(&quot;\' + $name + \'&quot;);"
		});
	}

	/**
	 * Inject outline and inline combo at marked spot.
	 * @param {Status} status
	 * @param {Markup} markup
	 * @param {Output} output
	 * @param {Map<string,string>} combo
	 */
	_injectcombo(status, markup, output, combo) {
		var body = output.body,
			temp = output.temp,
			spot = status.spot,
			prev = body.substring(0, spot),
			next = body.substring(spot),
			name = '$' + (++this._keycounter);
		var outl = combo.outline.replace("$name", name).replace("$temp", temp);
		output.body =
			prev + "\n" +
			outl +
			next +
			combo.inline.replace("$name", name);
		status.spot += outl.length + 1;
	}
}


// Static ......................................................................

/**
 * Matches a qualified attribute name (class,id,src,href) allowing
 * underscores, dashes and dots while not starting with a number.
 * TODO: class and id may start with a number nowadays!!!!!!!!!!!!
 * TODO: https://github.com/jshint/jshint/issues/383
 * @type {RegExp}
 */
Compiler._ATTREXP = /^[^\d][a-zA-Z0-9-_\.]+/;
