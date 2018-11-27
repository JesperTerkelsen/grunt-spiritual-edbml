'use strict';

/**
 * EDB processing instruction.
 * TODO: Problem with one-letter variable names in <?input name="a" type="TestData"?>
 * @param {string} pi
 */
class Instruction {
	/**
	 * @param {string} pi
	 */
	constructor(pi) {
		this.tag = pi.split('<?')[1].split(' ')[0];
		this.att = Object.create(null);
		var hit,
			atexp = Instruction._ATEXP;
		while ((hit = atexp.exec(pi))) {
			var n = hit[1],
				v = hit[2];
			this.att[n] = cast(v);
		}
	}
}

// Static ......................................................................

/**
 * Extract processing instructions from source.
 * @param {string} source
 * @returns {Array<Instruction>}
 */
Instruction.from = function(source) {
	var pis = [],
		hit = null;
	while ((hit = this._PIEXP.exec(source))) {
		pis.push(new Instruction(hit[0]));
	}
	return pis;
};

/**
 * Remove processing instructions from source.
 * @param {string} source
 * @returns {string}
 */
Instruction.clean = function(source) {
	return source.replace(this._PIEXP, '');
};

/**
 * Math processing instruction.
 * @type {RegExp}
 */
Instruction._PIEXP = /<\?.[^>?]+\?>/g;

/**
 * Match attribute name and value.
 * @type {RegExp}
 */
Instruction._ATEXP = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g;
