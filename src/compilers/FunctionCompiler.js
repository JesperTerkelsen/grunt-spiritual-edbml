'use strict';

/**
 * Function compiler.
 * @extends {Compiler}
 */
class FunctionCompiler extends Compiler {
	/**
	 * Construction time again.
	 */
	constructor() {
		super();

		/**
		 * Compile sequence.
		 * @type {Array<function>}
		 */
		this._sequence = [
			this._uncomment,
			this._validate,
			this._extract,
			this._direct,
			this._compile,
			this._definehead,
			this._injecthead,
			this._macromize
		];

		/**
		 * Options from Grunt.
		 * @type {Map}
		 */
		this._options = null;

		/**
		 * Hm.
		 */
		this._macros = null;

		/**
		 * Mapping script tag attributes.
		 * This may be put to future use.
		 * @type {Map<string,string>}
		 */
		this._directives = null;

		/**
		 * Processing intstructions.
		 * @type {Array<Instruction>}
		 */
		this._instructions = null;

		/**
		 * Compiled arguments list.
		 * @type {Array<string>}
		 */
		this._params = null;

		/**
		 * Tracking imported functions.
		 * @type {Map<string,string>}
		 */
		this._functions = {};

		/**
		 * Did compilation fail just yet?
		 * @type {boolean}
		 */
		this._failed = false;
	}

	/**
	 * Compile EDBML source to function.
	 * @param {string} source
	 * @param {Map<string,string} options
	 * @param {???} macros
	 * @param {Map<string,string} directives
	 * @returns {Result}
	 */
	compile(source, options, macros, directives) {
		this._directives = directives || {};
		this._options = options || {};
		this._macros = macros;
		this._params = [];
		this._functions = {};
		this._head = {};
		source = this._sequence.reduce((s, step) => {
			return step.call(this, s);
		}, source);
		return new Result(source, this._params, this._instructions);
	}

	// Private ...................................................................

	/**
	 * Strip HTML and JS comments.
	 * @param {string} script
	 * @returns {string}
	 */
	_uncomment(script) {
		return new Stripper().strip(script);
	}

	/**
	 * Confirm no nested EDBML scripts.
	 * @see http://stackoverflow.com/a/6322601
	 * @param {string} script
	 * @returns {string}
	 */
	_validate(script) {
		if (FunctionCompiler._NESTEXP.test(script)) {
			throw 'Nested EDBML dysfunction';
		}
		return script;
	}

	/**
	 * Handle directives. Nothing by default.
	 * @param  {string} script
	 * @returns {string}
	 */
	_direct(script) {
		return script;
	}

	/**
	 * Extract and evaluate processing instructions.
	 * @param {string} script
	 * @returns {string}
	 */
	_extract(script) {
		Instruction.from(script).forEach(pi => {
			this._instructions = this._instructions || [];
			this._instructions.push(pi);
			this._instruct(pi);
		});
		return Instruction.clean(script);
	}

	/**
	 * Evaluate processing instruction.
	 * @param {Instruction} pi
	 */
	_instruct(pi) {
		var att = pi.att;
		switch (pi.tag) {
			case 'param':
				this._params.push(att.name);
				break;
			case 'function':
				this._functions[att.name] = att.src;
				break;
		}
	}

	/**
	 * Define stuff in head. Using var name underscore hack
	 * to bypass the macro hygiene, will be normalized later.
	 * TODO: In string checks, also check for starting '('
	 * @param {string} script
	 * @param {object} head
	 * @returns {string}
	 */
	_definehead(script) {
		var head = this._head;
		var params = this._params;
		var functions = this._functions;
		if (params.indexOf('out') < 0) {
			head.out = '$edbml.$out__MACROFIX';
		}
		if (script.contains('@')) {
			// TODO: run macros FIRST at look for '$att' ???
			head.$att__MACROFIX = '$edbml.$att__MACROFIX';
		}
		if (script.contains('$set')) {
			head.$set = 'edbml.$set';
		}
		if (script.contains('$txt')) {
			head.$txt = 'edbml.safetext';
		}
		if (script.contains('$val')) {
			head.$val = 'edbml.safeattr';
		}
		each(functions, function(name, src) {
			head[name] = src + '.lock(out)';
		});
		return script;
	}

	/**
	 * Inject stuff in head. Let's just hope that V8 keeps on iterating
	 * object keys in chronological order (in which they were defined).
	 * @param {string} script
	 * @param {object} head
	 * @returns {string}
	 */
	_injecthead(script, head) {
		return (
			"'use strict';\n" +
			'var ' +
			each(this._head, (name, value) => {
				return name + (value !== undefined ? ' = ' + value : '');
			}).join(',') +
			';' +
			script
		);
	}

	/**
	 * Release the macros. Normalize variable names that were
	 * hacked  to bypass the internal macro hygiene routine.
	 * @param {string} script
	 * @returns {string}
	 */
	_macromize(script) {
		script = this._macros ? this._macros.compile(script) : script;
		return script.replace(/__MACROFIX/g, '');
	}

	/**
	 * Compute full script source (including arguments) for debugging stuff.
	 * @returns {string}
	 */
	_source(source, params) {
		var lines = source.split('\n');
		lines.pop(); // empty line :/
		var args = params.length ? '( ' + params.join(', ') + ' )' : '()';
		return 'function ' + args + ' {\n' + lines.join('\n') + '\n}';
	}
}

// Static ......................................................................

/**
 * RegExp used to validate no nested scripts. Important back when all this was a
 * clientside framework because the browser can't parse nested scripts, nowadays
 * it might be practical?
 * http://stackoverflow.com/questions/1441463/how-to-get-regex-to-match-multiple-script-tags
 * http://stackoverflow.com/questions/1750567/regex-to-get-attributes-and-body-of-script-tags
 * TODO: stress test for no SRC attribute!
 * @type {RegExp}
 */
FunctionCompiler._NESTEXP = /<script.*type=["']?text\/edbml["']?.*>([\s\S]+?)/g;
