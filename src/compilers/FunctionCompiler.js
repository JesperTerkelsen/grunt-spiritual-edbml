"use strict";

/**
 * Compiling EDBML to JS.
 * TODO: precompiler to strip out both JS comments and HTML comments.
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
			this._definehead,
			this._injecthead,
			this._compile,
			this._macromize
		];

		/**
		 * Hm.
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
		 * Imported functions.
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
	 * Compile source to invocable function.
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
	 * Strip HTML comments.
	 * @param {string} script
	 * @returns {string}
	 */
	_uncomment(script) {
		script = this._stripout(script, '<!--', '-->');
		script = this._stripout(script, '/*', '*/');
		return script;
	}

	/**
	 * TODO: This could do with some serious testing.
	 * @param {string} s1
	 * @param {string} s2
	 * @returns {string}
	 */
	_stripout(script, s1, s2) {
		var a1 = s1.split(''),
			a2 = s2.split(''),
			c1 = a1.shift(),
			c2 = a2.shift();
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
			start = (c, i) => {
				return c === c1 && ahead(i + 1, s1);
			},
			stops = (c, i) => {
				return c === c2 && prevs(i, s2);
			};
		if (script.contains('<!--')) {
			chars = script.split('');
			return chars.map((chaa, i) => {
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
			}).join('');
		}
		return script;
	}

	/**
	 * Confirm no nested EDBML scripts.
	 * @see http://stackoverflow.com/a/6322601
	 * @param {string} script
	 * @returns {string}
	 */
	_validate(script) {
		if (FunctionCompiler._NESTEXP.test(script)) {
			throw "Nested EDBML dysfunction";
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
		Instruction.from(script).forEach((pi) => {
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
			case "param":
				this._params.push(att.name);
				break;
			case "function":
				this._functions[att.name] = att.src;
				//this._head[att.name] = att.src + '.lock(out)';
				break;
		}
	}

	/**
	 * Define stuff in head. Using var name underscore hack
	 * to bypass the macro hygiene, will be normalized later. 
	 * TODO: Restructure this._sequence so that we don't 
	 * declare stuff in head that isn't actually used.
	 * @param {string} script
	 * @param {object} head
	 * @returns {string}
	 */
	_definehead(script) {
		var head = this._head;
		var params = this._params;
		var functions = this._functions;
		if (params.indexOf("out") < 0) {
			head.out = "$edbml.$out__MACROFIX";
		}
		head.$att__MACROFIX = '$edbml.$att__MACROFIX';
		head.$txt = 'edbml.safetext';
		head.$val = 'edbml.safeattr';
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
		return 'var ' + each(this._head, (name, value) => {
			return name + ' = ' + value;
		}).join(',') + ';' + script;
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
		var lines = source.split("\n");
		lines.pop(); // empty line :/
		var args = params.length ? "( " + params.join(", ") + " )" : "()";
		return "function " + args + " {\n" + lines.join("\n") + "\n}";
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
