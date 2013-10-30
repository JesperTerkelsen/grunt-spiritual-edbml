"use strict";

/**
 * Compiler.
 */
class Compiler {

	/**
	 * Line begins.
	 * @param {String} line
	 * @param {Runner} runner
	 * @param {Status} status
	 * @param {Result} result
	 */
	newline ( line, runner, status, result ) {
		status.last = line.length - 1;
		status.adds = line [ 0 ] === "+";
		status.cont = status.cont || ( status.ishtml () && status.adds );
	}

	/**
	 * Line ends.
	 * @param {String} line
	 * @param {Runner} runner
	 * @param {Status} status
	 * @param {Result} result
	 */
	endline ( line, runner, status, result ) {
		if ( status.ishtml ()) {
			if ( !status.cont ) {
				result.body += "';\n";
				status.gojs ();
			}
		} else {
			result.body += "\n";
		}
		status.cont = false;
	}

	/**
	 * Next char.
	 * @param {String} c
	 * @param {Runner} runner
	 * @param {Status} status
	 * @param {Result} result
	 */
	nextchar ( c, runner, status, result ) {
		switch ( status.mode ) {
			case Status.MODE_JS :
				this._compilejs ( c, runner, status, result );
				break;
			case Status.MODE_HTML :
				this._compilehtml ( c, runner, status, result);
				break;
			case Status.MODE_TAG :
				this._compiletag ( c, runner, status, result );
				break;
		}
		if ( status.skip-- <= 0 ) {
			if ( status.poke || status.geek ) {
				result.temp += c;
			} else {
				if ( !status.istag ()) {
					result.body += c;
				}
			}
		}
	}


	// Private .....................................................
	
	/**
	 * Compile EDBML source to function body.
	 * @param {String} script
	 * @returns {String}
	 */
	_compile ( script ) {
		var runner = new Runner (); 
		var status = new Status ();
		var result = new Result ( '"use strict";\n' );
		runner.run ( this, script, status, result );
		result.body += ( status.ishtml () ? "';" : "" ) + "\nreturn out.write ();";
		return result.format ();
	}

	/**
	 * Compile character as script.
	 * @param {String} c
	 * @param {Runner} runner
	 * @param {Status} status
	 * @param {Result} result
	 */
	_compilejs ( c, runner, status, result ) {
		switch ( c ) {
			case "<" :
				if ( runner.firstchar ) {
					var line = "JSHINT";
					var i = "JSHINT";
					var tag;
					if ( false && ( tag = this._tagstart ( line ))) {
						status.gotag ();
						this._aaa ( status, line, i );
					} else if ( false && ( tag = this._tagstop ( line ))) {
						status.gotag (); // js?
						this._bbb ( status );
					} else {
						status.gohtml ();
						status.spot = result.body.length - 1;
						result.body += "out.html += '";
					}
				}
				break;
			case "@" :
				this._scriptatt ( runner, status, result );
				break;
		}
	}
	
	/**
	 * Compile character as HTML.
	 * @param {String} c
	 * @param {Runner} runner
	 * @param {Status} status
	 * @param {Result} result
	 */
	_compilehtml ( c, runner, status, result ) {
		var special = status.peek || status.poke || status.geek;
		switch ( c ) {
			case "{" :
				if ( special ) {
					status.curl ++;
				}
				break;
			case "}" :
				if ( -- status.curl === 0 ) {
					if ( status.peek ) {
						status.peek = false;
						status.skip = 1;
						status.curl = 0;
						result.body += ") + '";
					}
					if ( status.poke ) {
						this._poke ( status, result );
						status.poke = false;
						result.temp = null;
						status.spot = -1;
						status.skip = 1;
						status.curl = 0;
					}
					if ( status.geek ) {
						this._geek ( status, result );
						status.geek = false;
						result.temp = null;
						status.spot = -1;
						status.skip = 1;
						status.curl = 0;
					}
				}
				break;
			case "$" :
				if ( !special && runner.ahead ( "{" )) {
					if ( runner.behind ( "gui.test=\"" )) {
						status.geek = true;
						status.skip = 2;
						status.curl = 0;
						result.temp = "";
					} else {
						status.peek = true;
						status.skip = 2;
						status.curl = 0;
						result.body += "' + (";
					}			
				}
				break;
			case "#" :
				if ( !special && runner.ahead ( "{" )) {
					status.poke = true;
					status.skip = 2;
					status.curl = 0;
					result.temp = "";
				}
				break;
			case "+" :
				if ( runner.firstchar ) {
					status.skip = status.adds ? 1 : 0;
				} else if ( runner.lastchar ) {
					status.cont = true;
					status.skip = 1;
				}
				break;
			case "'" :
				if ( !special ) {
					result.body += "\\";
				}
				break;
			case "@" :
				this._htmlatt ( runner, status, result );
				break;
		}
	}

	/**
	 * Compile character as tag.
	 * @param {String} c
	 * @param {Runner} runner
	 * @param {Status} status
	 * @param {Result} result
	 */
	_compiletag ( status, c, i, line ) {
		switch ( c ) {
			case "$" :
				if ( this._ahead ( line, i, "{" )) {
					status.refs = true;
					status.skip = 2;
				}
				break;
			case ">" :
				status.gojs ();
				status.skip = 1;
				break;
		}
	}

	/*
	 * Parse @ notation in JS.
	 * TODO: preserve email address and allow same-line @
	 * @param {String} line
	 * @param {number} i
	 */
	_scriptatt ( runner, status, result ) {
		var attr = Compiler._ATTREXP;
		var rest, name;
		if ( runner.behind ( "@" )) {} 
		else if ( runner.ahead ( "@" )) {
			result.body += "var att = new Att ();";
			status.skip = 2;
		} else {
			rest = runner.lineahead ();
			name = attr.exec ( rest )[ 0 ];
			if ( name ) {
				result.body += rest.replace ( name, "att['" + name + "']" );
				status.skip = rest.length + 1;
			} else {
				throw "Bad @name: " + rest;
			}
		}
	}

	/*
	 * Parse @ notation in HTML.
	 * @param {String} line
	 * @param {number} i
	 */
	_htmlatt ( runner, status, result ) {
		var attr = Compiler._ATTREXP;
		var rest, name, dels, what;
		if ( runner.behind ( "@" )) {}
		else if ( runner.behind ( "#{" )) { console.error ( "todo" );} // onclick="#{@passed}"
		else if ( runner.ahead ( "@" )) {
			result.body += "' + att._all () + '";
			status.skip = 2;
		} else {
			rest = runner.lineahead ();
			name = attr.exec ( rest )[ 0 ];
			dels = runner.behind ( "-" );
			what = dels ? "att._pop" : "att._out";
			result.body = dels ? result.body.substring ( 0, result.body.length - 1 ) : result.body;
			result.body += "' + " + what + " ( '" + name + "' ) + '";
			status.skip = name.length + 1;
		}
	}

	/**
	 * Generate poke at marked spot.
	 * @param {Status} status
	 * @param {Result} result
	 */
	_poke ( status, result ) {
		this._inject ( status, result, Compiler._POKE );
	}

	/**
	 * Generate geek at marked spot.
	 * @param {Status} status
	 * @param {Result} result
	 */
	_geek ( status, result ) {
		this._inject ( status, result, Compiler._GEEK );
	}

	/**
	 * Inject JS (outline and inline combo) at marked spot.
	 * @param {Status} status
	 * @param {Result} result
	 * @param {Map<String,String>} js
	 */
	_inject ( status, result, js ) {
		var body = result.body,
			temp = result.temp,
			spot = status.spot,
			prev = body.substring ( 0, spot ),
			next = body.substring ( spot ),
			name = unique (); //gui.KeyMaster.generateKey ();
		result.body = 
			prev + "\n" + 
			js.outline.replace ( "$name", name ).replace ( "$temp", temp ) + 
			next +
			js.inline.replace ( "$name", name );
	}

}


// Static ........................................................................

/**
 * Poke.
 * @type {String}
 */
Compiler._POKE = {
	outline : "var $name = edb.set ( function ( value, checked ) {\n$temp;\n}, this );",
	inline: "edb.go(event,&quot;\' + $name + \'&quot;);"
};

/**
 * Geek.
 * @type {String}
 */
Compiler._GEEK = {
	outline : "var $name = edb.set ( function () {\nreturn $temp;\n}, this );",
	inline: "edb.get(&quot;\' + $name + \'&quot;);"
};

/**
 * Matches a qualified attribute name (class,id,src,href) allowing 
 * underscores, dashes and dots while not starting with a number. 
 * @TODO class and id may start with a number nowadays!!!!!!!!!!!!
 * @TODO https://github.com/jshint/jshint/issues/383
 * @type {RegExp}
 */
Compiler._ATTREXP = /^[^\d][a-zA-Z0-9-_\.]+/;
