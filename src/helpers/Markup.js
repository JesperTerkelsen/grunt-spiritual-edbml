'use strict';

/**
 * Tracking the state of
 * markup while compiling.
 */
class Markup {
	constructor() {
		this.tag = null; // current tagname (if applicable)
		this.att = null; // current attname (not maintained!)

		this._is = null;
		this._buffer = null;
		this._quotes = null;
		this._snapshots = [];
		this._index = -1;
		this._go('txt');
	}

	next(c) {
		this._index++;
		switch (c) {
			case '<':
			case '>':
				this._ontag(c);
				break;
			case ' ':
				this._onspace(c);
				break;
			case '=':
				this._onequal(c);
				break;
			case '"':
			case "'":
				this._onquote(c);
				break;
			default:
				this._buf(c);
				break;
		}
		this._prevchar = c;
		return this._is;
	}

	/**
	 * Log snapshots to console (for debugging purpose).
	 * You can call this method over in class Runner.js
	 */
	debug() {
		this._debug(this._snapshots);
	}

	// Private ...................................................................

	/**
	 * Tag chars.
	 * @param {string} c
	 */
	_ontag(c) {
		if (c === '<') {
			if (this._is === 'txt') {
				this.tag = null;
				this._go('tag');
			}
		} else {
			if (this._is === 'tag') {
				this.tag = this._buffer.trim();
			}
			switch (this._is) {
				case 'att':
				case 'tag':
					this.tag = null;
					this._go('txt');
					break;
			}
		}
	}

	/**
	 * Quote chars. We may assume the author to use double
	 * quotes, single quotes and no quotes for attributes.
	 * @param {string} c
	 */
	_onquote(c) {
		var previndex = this._index - 1;
		switch (this._is) {
			case 'val':
				if (this._quotes) {
					if (this._quotes === c && this._prevchar !== '\\') {
						this._go('att');
					}
				} else if (this._was(previndex, 'att')) {
					this._quotes = c;
				}
				break;
			default:
				this._buf(c);
				break;
		}
	}

	/**
	 * Space chars.
	 * TODO: Important: All sorts of (multiple) whitespace characters going on!
	 * @param {string} c
	 */
	_onspace(c) {
		switch (this._is) {
			case 'tag':
				this.tag = this._buffer.trim();
				this._go('att');
				break;
			case 'val':
				if (!this._quotes) {
					this._go('att');
				}
				break;
			default:
				this._buf(c);
				break;
		}
	}

	/**
	 * Equal sign.
	 * @param {string} c
	 */
	_onequal(c) {
		if (this._is === 'att') {
			this._go('val');
		} else {
			this._buf(c);
		}
	}

	/**
	 * Buffer char.
	 * @param {string} c
	 */
	_buf(c) {
		this._buffer += c;
	}

	/**
	 * Take snapshot, clear the buffer and change to new mode.
	 * @param {string} newis
	 */
	_go(newis) {
		if (this._is !== null) {
			this._snapshots.push([this._index, this._is, this._buffer]);
		}
		this._quotes = null;
		this._buffer = '';
		this._is = newis;
	}

	/**
	 * Was type at index?
	 * @param {number} index
	 * @param {string} type
	 */
	_was(index, type) {
		var ix,
			it,
			match,
			snap,
			prev,
			snaps = this._snapshots;
		if (snaps.length) {
			it = snaps.length - 1;
			while (!match && (snap = snaps[it--])) {
				if ((ix = snap[0]) === index) {
					match = snap;
				} else if (ix < index) {
					match = prev;
				}
				prev = snap;
			}
			return match && match[1] === type;
		}
		return false;
	}

	// Deboogie ..................................................................

	/**
	 * Quick and dirty debugging: The string
	 * in the console should look like HTML.
	 * @param {Array<Array<string>>} snapshots
	 */
	_debug(snapshots) {
		var index,
			is,
			was,
			buffer,
			yyy,
			next,
			end,
			tab = '\t',
			tabs = [];
		console.log(
			snapshots.reduce(function(html, snap) {
				index = snap[0];
				is = snap[1];
				buffer = snap[2];
				switch (is) {
					case 'tag':
						if ((end = buffer[0] === '/')) {
							tabs.pop();
						}
						was = was === 'txt' && yyy.trim().length ? '' : was;
						next = (was ? '\n' + tabs.join('') : '') + '<' + buffer;
						if (!end) {
							tabs.push(tab);
						}
						break;
					case 'att':
						next = ' ' + buffer.trim();
						if (next === ' ') {
							next = '';
						}
						break;
					case 'val':
						next = '="' + buffer + '"';
						break;
					case 'txt':
						next = (was ? '>' : '') + buffer;
						break;
				}
				was = is;
				yyy = buffer;
				return html + next;
			}, '') + (was === 'tag' ? '>' : '')
		);
	}
}

// Static ......................................................................

Markup.CONTEXT_TXT = 'txt';
Markup.CONTEXT_ATT = 'att';
Markup.CONTEXT_VAL = 'val';
