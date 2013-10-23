"use strict";

/**
 * Stateful compiler stuff.
 * @param {String} body
 */
function Status () {
	this.conf = [];
}

// Static ....................................................

Status.MODE_JS = "js";
Status.MODE_HTML = "html";
Status.MODE_TAG = "tag";

// Instance ..................................................

Status.prototype = {
	mode : Status.MODE_JS,
	peek : false,
	poke : false,
	cont : false,
	adds : false,
	func : null,
	conf : null,
	curl : null,
	skip : 0,
	last : 0,
	spot : 0,
	indx : 0,

	// tags
	refs : false, // pass by reference in tags

	/**
	 * Is JS mode?
	 * @returns {boolean}
	 */
	isjs : function () {
		return this.mode === Status.MODE_JS;
	},

	/**
	 * Is HTML mode?
	 * @returns {boolean}
	 */
	ishtml : function () {
		return this.mode === Status.MODE_HTML;
	},

	/**
	 * Is tag mode?
	 * @returns {boolean}
	 */
	istag : function () {
		return this.mode === Status.MODE_TAG;
	},

	/**
	 * Go JS mode.
	 */
	gojs : function () {
		this.mode = Status.MODE_JS;
	},

	/**
	 * Go HTML mode.
	 */
	gohtml : function () {
		this.mode = Status.MODE_HTML;
	},

	/**
	 * Go tag mode.
	 */
	gotag : function () {
		this.mode = Status.MODE_TAG;
	}
};