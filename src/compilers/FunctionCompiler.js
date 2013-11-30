"use strict";

/**
 * Compiling EDBML source to JavaScript.
 * @extends {Compiler}
 * @TODO precompiler to strip out both JS comments and HTML comments.
 */
class FunctionCompiler extends Compiler {
	
	/**
	 * @param {String} key
	 */
	constructor ( key ) {

		super ( key );

		/**
		 * Compile sequence.
		 * @type {Array<string>}
		 */
		this.sequence = [ 
			this._validate,
			this._extract,
			this._direct,
			this._define,
			this._compile
		];

		/**
		 * Mapping script tag attributes. 
		 * This may be put to future use.
		 * @type {HashMap<String,String>}
		 */
		this._directives = null;

		/**
		 * Processing intstructions.
		 * @type {Array<Instruction>}
		 */
		this._instructions = null;

		/**
		 * Compiled function arguments list. 
		 * @type {Array<String>}
		 */
		this._params = null;

		/**
		 * Did compilation fail just yet?
		 * @type {boolean}
		 */
		this._failed = false;
	}
		
	/**
	 * Compile source to invocable function.
	 * @param {String} source
	 * @param {Map<String,String} directives
	 * @returns {String}
	 */
	compile ( source, directives ) {
		this._directives = directives || {};
		this._params = [];
		var head = {
			declarations : {}, // Map<String,boolean>
			functiondefs : [] // Array<String>
		};
		source = this.sequence.reduce (( s, step ) => {
			return step.call ( this, s, head );
		}, source );
		return new Result ( source, this._params, this._instructions );
	}


	// Private ..............................................................................

	/**
	 * Confirm no nested EDBML scripts.
	 * @see http://stackoverflow.com/a/6322601
	 * @param {String} script
	 * @param {What?} head
	 * @returns {String}
	 */
	_validate ( script ) {
		if ( FunctionCompiler._NESTEXP.test ( script )) {
			throw "Nested EDBML dysfunction";
		}
		return script;
	}

	/**
	 * Handle directives. Nothing by default.
	 * @param  {String} script
	 * @returns {String}
	 */
	_direct ( script ) {
		return script;
	}
	
	/**
	 * Extract and evaluate processing instructions.
	 * @param {String} script
	 * @param {What?} head
	 * @returns {String}
	 */
	_extract ( script, head ) {
		Instruction.from ( script ).forEach (( pi ) => {
			this._instructions = this._instructions || [];
			this._instructions.push ( pi );
			this._instruct ( pi );
		});
		return Instruction.clean ( script );
	}

	/**
	 * Evaluate processing instruction.
	 * @param {Instruction} pi
	 */
	_instruct ( pi ) {
		var type = pi.type;
		var atts = pi.atts;
		var name = atts.name;
		switch ( type ) {
			case "param" :
				this._params.push ( name );
				break;
		}
	}

	/**
	 * Define stuff in head.
	 * @param {String} script
	 * @param {What?} head
	 * @returns {String}
	 */
	_define ( script, head ) {
		var vars = "", html = "var ";
		each ( head.declarations, ( name ) => {
			vars += ", " + name;
		});
		if ( this._params.indexOf ( "out" ) < 0 ) {
			html += "out = new edb.Out (), ";
		}
		if ( this._params.indexOf ( "att" ) < 0 ) {
			html += "att = new edb.Att () ";
		}
		html += vars + ";\n";
		head.functiondefs.forEach (( def ) => {
			html += def +"\n";
		});
		return html + script;
	}
	
	/**
	 * Compute full script source (including arguments) for debugging stuff.
	 * @returns {String}
	 */
	_source ( source, params ) {
		var lines = source.split ( "\n" ); lines.pop (); // empty line :/
		var args = params.length ? "( " + params.join ( ", " ) + " )" : "()";
		return "function " + args + " {\n" + lines.join ( "\n" ) + "\n}";
	}

}

// Static ..................................................................................

/**
 * RegExp used to validate no nested scripts. 
 * http://stackoverflow.com/questions/1441463/how-to-get-regex-to-match-multiple-script-tags
 * http://stackoverflow.com/questions/1750567/regex-to-get-attributes-and-body-of-script-tags
 * TODO: stress test for no SRC attribute!
 * @type {RegExp}
 */
FunctionCompiler._NESTEXP = /<script.*type=["']?text\/edbml["']?.*>([\s\S]+?)/g;
