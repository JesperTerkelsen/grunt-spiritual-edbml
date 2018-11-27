'use strict';

/**
 * Strip out comments in the crudest possible way.
 */
class Stripper {
	/**
	 * Strip HTML and JS comments.
	 * @param {string} script
	 * @returns {string}
	 */
	strip(script) {
		script = this._stripout(script, '<!--', '-->');
		script = this._stripout(script, '/*', '*/');
		script = this._stripout(script, '^//', '\n');
		return script;
	}

	// Private ...................................................................

	/**
	 * Screening the stripper.
	 * @param {string} s1
	 * @param {string} s2
	 * @returns {string}
	 */
	_stripout(script, s1, s2) {
		var first = s1[0] === '^';
		s1 = first ? s1.substring(1) : s1;
		if (script.contains(s1) && script.contains(s2)) {
			script = this._stripall(script, s1, s2, first);
		}
		return script;
	}

	/**
	 * Strip all comments with no concern about the context they appear in...
	 * @param {string} s1
	 * @param {string} s2
	 * @param {boolean} first
	 * @returns {string}
	 */
	_stripall(script, s1, s2, first) {
		var WHITESPACE = /\s/;
		var a1 = s1.split(''),
			a2 = s2.split(''),
			c1 = a1.shift(),
			c2 = a2.pop();
		s1 = a1.join('');
		s2 = a2.join('');
		var chars = null,
			pass = false,
			next = false,
			fits = (i, l, s) => {
				return chars.slice(i, l).join('') === s;
			},
			ahead = (i, s) => {
				var l = s.length;
				return fits(i, i + l, s);
			},
			prevs = (i, s) => {
				var l = s.length;
				return fits(i - l, i, s);
			},
			begins = (c, i) => {
				var does = true;
				while (i > 0 && (c = script[--i]) !== '\n') {
					if (!c.match(WHITESPACE)) {
						does = false;
						break;
					}
				}
				return does;
			},
			start = (c, i) => {
				var does = c === c1 && ahead(i + 1, s1);
				return does && first ? begins(c, i) : does;
			},
			stops = (c, i) => {
				return c === c2 && prevs(i, s2);
			};
		chars = script.split('');
		return chars
			.map((chaa, i) => {
				if (pass) {
					if (stops(chaa, i)) {
						next = true;
					}
				} else {
					if (start(chaa, i)) {
						pass = true;
					}
				}
				if (pass || next) {
					chaa = '';
				}
				if (next) {
					pass = false;
					next = false;
				}
				return chaa;
			})
			.join('');
	}
}
