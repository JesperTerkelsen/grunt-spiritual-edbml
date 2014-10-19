"use strict";

/**
 * Tracking compiler state while compiling.
 */
class Status {

	constructor() {
		this.mode = Status.MODE_JS;
		this.conf = [];
		this.peek = false;
		this.poke = false;
		this.cont = false;
		this.adds = false;
		this.func = null;
		this.conf = null;
		this.curl = null;
		this.skip = 0;
		this.last = 0;
		this.spot = 0;
		this.indx = 0;
	}

	/**
	 * Go JS mode.
	 */
	gojs() {
		this.mode = Status.MODE_JS;
	}

	/**
	 * Go HTML mode.
	 */
	gohtml() {
		this.mode = Status.MODE_HTML;
	}

	/**
	 * Go tag mode.
	 */
	gotag() {
		this.mode = Status.MODE_TAG;
	}

	/**
	 * Is JS mode?
	 * @returns {boolean}
	 */
	isjs() {
		return this.mode === Status.MODE_JS;
	}

	/**
	 * Is HTML mode?
	 * @returns {boolean}
	 */
	ishtml() {
		return this.mode === Status.MODE_HTML;
	}

	/**
	 * Is tag mode?
	 * @returns {boolean}
	 */
	istag() {
		return this.mode === Status.MODE_TAG;
	}
}


// Static ...............................

Status.MODE_JS = "js";
Status.MODE_HTML = "html";
Status.MODE_TAG = "tag";
