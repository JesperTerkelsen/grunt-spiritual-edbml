"use strict";
// Source: build/compiler-es5.js
var _extends = function (child, parent) {
  child.prototype = Object.create(parent.prototype, {
    constructor: {
      value: child,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  child.__proto__ = parent;
};

var _classProps = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

/**
 * Call function for each own key in object (exluding the prototype stuff)
 * with key and value as arguments. Returns array of function call results.
 * @param {object} object
 * @param {function} func
 * @param @optional {object} thisp
 */
function each(object, func, thisp) {
  return Object.keys(object).map(function (key) {
    return func.call(thisp, key, object[key]);
  });
}

/**
 * Autocast string to an inferred type. "123" returns a number
 * while "true" and false" return a boolean. Empty string evals
 * to `true` in order to support HTML attribute minimization.
 * @param {string} string
 * @returns {object}
 */
function cast(string) {
  var result = String(string);
  switch (result) {
    case "null":
      result = null;
      break;
    case "true":
    case "false":
      result = (result === "true");
      break;
    default:
      if (String(parseInt(result, 10)) === result) {
        result = parseInt(result, 10);
      } else if (String(parseFloat(result)) === result) {
        result = parseFloat(result);
      }
      break;
  }
  return result === "" ? true : result;
}

/**
 * Generate unique key.
 * Note: Key structure must be kept in sync with {gui.KeyMaster#generatekey}.
 * @returns {string}
 */
var generateKey = (function () {
  var keys = {};
  return function () {
    var ran = Math.random().toString();
    var key = "key" + ran.slice(2, 11);
    if (keys[key]) {
      key = generateKey();
    } else {
      keys[key] = true;
    }
    return key;
  };
}());

/**
 * What? This is wrong on so many.
 * @param {string} string
 * @returns {boolean}
 */
String.prototype.contains = function (string) {
  return this.indexOf(string) > -1;
};

/**
 * Come on.
 * @param {string} string
 * @returns {boolean}
 */
String.prototype.startsWith = function (string) {
  return this.indexOf(string) === 0;
};

/**
 * Again? That's it. Good luck.
 * @param {string} string
 * @returns {boolean}
 */
String.prototype.endsWith = function (string) {
  return this.indexOf(string) === this.length - 1;
};



var Compiler = (function () {
  var Compiler =

  /**
   * Let's go.
   */
  function Compiler() {
    this._keycounter = 0;
  };

  _classProps(Compiler, null, {
    newline: {
      writable: true,


      /**
       * Line begins.
       * @param {string} line
       * @param {Runner} runner
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       */
      value: function (line, runner, status, markup, output) {
        status.last = line.length - 1;
        status.adds = line[0] === "+";
        status.cont = status.cont || (status.ishtml() && status.adds);
      }
    },
    endline: {
      writable: true,


      /**
       * Line ends.
       * @param {string} line
       * @param {Runner} runner
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       */
      value: function (line, runner, status, markup, output) {
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
    },
    nextchar: {
      writable: true,


      /**
       * Next char.
       * @param {string} c
       * @param {Runner} runner
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       */
      value: function (c, runner, status, markup, output) {
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
    },
    _compile: {
      writable: true,



      // Private ...................................................................

      /**
       * Compile EDBML source to function body.
       * @param {string} script
       * @returns {string}
       */
      value: function (script) {
        var runner = new Runner();
        var status = new Status();
        var markup = new Markup();
        var output = new Output();
        runner.run(this, script, status, markup, output);
        output.body += (status.ishtml() ? "';" : "") + "\nreturn out.write ();";
        return output.body;
      }
    },
    _compilejs: {
      writable: true,


      /**
       * Compile character as script.
       * @param {string} c
       * @param {Runner} runner
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       */
      value: function (c, runner, status, markup, output) {
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
    },
    _compilehtml: {
      writable: true,


      /**
       * Compile character as HTML.
       * @param {string} c
       * @param {Runner} runner
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       */
      value: function (c, runner, status, markup, output) {
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
    },
    _continueshtml: {
      writable: true,


      /**
       * HTML continues on next line or
       * was continued from previous line?
       * @param {string} c
       * @param {Runner} runner
       * @param {Status} status
       * @returns {boolean}
       */
      value: function (c, runner, status) {
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
    },
    _escapefrom: {
      writable: true,


      /**
       * Get function to escape potentially
       * unsafe text in given markup context.
       * @param {string} context Markup state
       * @returns {string} Function name
       */
      value: function (context) {
        switch (context) {
          case Markup.CONTEXT_TXT:
            return "$txt";
          case Markup.CONTEXT_VAL:
            return "$val";
          default:
            return "";
        }
      }
    },
    _htmlatt: {
      writable: true,


      /**
       * Parse @ notation in HTML.
       * @param {Runner} runner
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       */
      value: function (runner, status, markup, output) {
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
    },
    _poke: {
      writable: true,


      /**
       * Generate $poke at marked spot.
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       */
      value: function (status, markup, output) {
        var tag = markup.tag || "";
        var arg = tag.match(/input|textarea/) ? "value, checked" : "";
        this._injectcombo(status, markup, output, {
          outline: "var $name = $set(function(" + arg + ") {\n$temp;\n}, this);",
          inline: "edbml.$run(event, \\'' + $name + '\\');"
        });
      }
    },
    _geek: {
      writable: true,


      /**
       * Generate ?geek at marked spot.
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       */
      value: function (status, markup, output) {
        this._injectcombo(status, markup, output, {
          outline: "var $name = $set(function() {\nreturn $temp;\n}, this);",
          inline: "edbml.$get(&quot;' + $name + '&quot;);"
        });
      }
    },
    _injectcombo: {
      writable: true,


      /**
       * Inject outline and inline combo at marked spot.
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       * @param {Map<string,string>} combo
       */
      value: function (status, markup, output, combo) {
        var body = output.body, temp = output.temp, spot = status.spot, prev = body.substring(0, spot), next = body.substring(spot), name = "$" + (++this._keycounter);
        var outl = combo.outline.replace("$name", name).replace("$temp", temp);
        output.body = prev + "\n" + outl + next + combo.inline.replace("$name", name);
        status.spot += outl.length + 1;
      }
    }
  });

  return Compiler;
})();




// Static ......................................................................

/**
 * Matches a qualified attribute name (class,id,src,href) allowing
 * underscores, dashes and dots while not starting with a number.
 * TODO: class and id may start with a number nowadays!!!!!!!!!!!!
 * TODO: https://github.com/jshint/jshint/issues/383
 * @type {RegExp}
 */
Compiler._ATTREXP = /^[^\d][a-zA-Z0-9-_\.]+/;



var FunctionCompiler = (function (Compiler) {
  var FunctionCompiler =

  /**
   * Construction time again.
   */
  function FunctionCompiler() {
    Compiler.call(this);

    /**
     * Compile sequence.
     * @type {Array<function>}
     */
    this._sequence = [this._uncomment, this._validate, this._extract, this._direct, this._compile, this._definehead, this._injecthead, this._macromize];

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
  };

  _extends(FunctionCompiler, Compiler);

  _classProps(FunctionCompiler, null, {
    compile: {
      writable: true,


      /**
       * Compile EDBML source to function.
       * @param {string} source
       * @param {Map<string,string} options
       * @param {???} macros
       * @param {Map<string,string} directives
       * @returns {Result}
       */
      value: function (source, options, macros, directives) {
        var _this = this;
        this._directives = directives || {};
        this._options = options || {};
        this._macros = macros;
        this._params = [];
        this._functions = {};
        this._head = {};
        source = this._sequence.reduce(function (s, step) {
          return step.call(_this, s);
        }, source);
        return new Result(source, this._params, this._instructions);
      }
    },
    _uncomment: {
      writable: true,



      // Private ...................................................................

      /**
       * Strip HTML and JS comments.
       * @param {string} script
       * @returns {string}
       */
      value: function (script) {
        return new Stripper().strip(script);
      }
    },
    _validate: {
      writable: true,


      /**
       * Confirm no nested EDBML scripts.
       * @see http://stackoverflow.com/a/6322601
       * @param {string} script
       * @returns {string}
       */
      value: function (script) {
        if (FunctionCompiler._NESTEXP.test(script)) {
          throw "Nested EDBML dysfunction";
        }
        return script;
      }
    },
    _direct: {
      writable: true,


      /**
       * Handle directives. Nothing by default.
       * @param  {string} script
       * @returns {string}
       */
      value: function (script) {
        return script;
      }
    },
    _extract: {
      writable: true,


      /**
       * Extract and evaluate processing instructions.
       * @param {string} script
       * @returns {string}
       */
      value: function (script) {
        var _this2 = this;
        Instruction.from(script).forEach(function (pi) {
          _this2._instructions = _this2._instructions || [];
          _this2._instructions.push(pi);
          _this2._instruct(pi);
        });
        return Instruction.clean(script);
      }
    },
    _instruct: {
      writable: true,


      /**
       * Evaluate processing instruction.
       * @param {Instruction} pi
       */
      value: function (pi) {
        var att = pi.att;
        switch (pi.tag) {
          case "param":
            this._params.push(att.name);
            break;
          case "function":
            this._functions[att.name] = att.src;
            break;
        }
      }
    },
    _definehead: {
      writable: true,


      /**
       * Define stuff in head. Using var name underscore hack
       * to bypass the macro hygiene, will be normalized later. 
       * TODO: In string checks, also check for starting '('
       * @param {string} script
       * @param {object} head
       * @returns {string}
       */
      value: function (script) {
        var head = this._head;
        var params = this._params;
        var functions = this._functions;
        if (params.indexOf("out") < 0) {
          head.out = "$edbml.$out__MACROFIX";
        }
        if (script.contains("@")) {
          // TODO: run macros FIRST at look for '$att' ???
          head.$att__MACROFIX = "$edbml.$att__MACROFIX";
        }
        if (script.contains("$set")) {
          head.$set = "edbml.$set";
        }
        if (script.contains("$txt")) {
          head.$txt = "edbml.safetext";
        }
        if (script.contains("$val")) {
          head.$val = "edbml.safeattr";
        }
        each(functions, function (name, src) {
          head[name] = src + ".lock(out)";
        });
        return script;
      }
    },
    _injecthead: {
      writable: true,


      /**
       * Inject stuff in head. Let's just hope that V8 keeps on iterating 
       * object keys in chronological order (in which they were defined).
       * @param {string} script
       * @param {object} head
       * @returns {string}
       */
      value: function (script, head) {
        return "'use strict';\n" + "var " + each(this._head, function (name, value) {
          return name + (value !== undefined ? " = " + value : "");
        }).join(",") + ";" + script;
      }
    },
    _macromize: {
      writable: true,


      /**
       * Release the macros. Normalize variable names that were
       * hacked  to bypass the internal macro hygiene routine.
       * @param {string} script
       * @returns {string}
       */
      value: function (script) {
        script = this._macros ? this._macros.compile(script) : script;
        return script.replace(/__MACROFIX/g, "");
      }
    },
    _source: {
      writable: true,


      /**
       * Compute full script source (including arguments) for debugging stuff.
       * @returns {string}
       */
      value: function (source, params) {
        var lines = source.split("\n");
        lines.pop(); // empty line :/
        var args = params.length ? "( " + params.join(", ") + " )" : "()";
        return "function " + args + " {\n" + lines.join("\n") + "\n}";
      }
    }
  });

  return FunctionCompiler;
})(Compiler);

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



var ScriptCompiler = (function (FunctionCompiler) {
  var ScriptCompiler =

  /**
   * Map observed types.
   * Add custom sequence.
   * @param {string} key
   */
  function ScriptCompiler() {
    FunctionCompiler.call(this);
    this.inputs = {};
  };

  _extends(ScriptCompiler, FunctionCompiler);

  _classProps(ScriptCompiler, null, {
    _instruct: {
      writable: true,



      // Private ...................................................................

      /**
       * Handle instruction.
       * @overrides {FunctionCompiler._instruct}
       * @param {Instruction} pi
       */
      value: function (pi) {
        FunctionCompiler.prototype._instruct.call(this, pi);
        var atts = pi.att;
        switch (pi.tag) {
          case "input":
            this.inputs[atts.name] = atts.type;
            break;
        }
      }
    },
    _definehead: {
      writable: true,


      /**
       * Define stuff in head.
       * @param {string} script
       * @param {object} head
       * @returns {string}
       */
      value: function (script) {
        var _this3 = this;
        script = FunctionCompiler.prototype._definehead.call(this, script);
        each(this.inputs, function (name, type) {
          _this3._head[name] = "$edbml.$input(" + type + ")";
        }, this);
        return script;
      }
    }
  });

  return ScriptCompiler;
})(FunctionCompiler);





var Instruction =

/**
 * @param {string} pi
 */
function Instruction(pi) {
  this.tag = pi.split("<?")[1].split(" ")[0];
  this.att = Object.create(null);
  var hit, atexp = Instruction._ATEXP;
  while ((hit = atexp.exec(pi))) {
    var n = hit[1], v = hit[2];
    this.att[n] = cast(v);
  }
};




// Static ......................................................................

/**
 * Extract processing instructions from source.
 * @param {string} source
 * @returns {Array<Instruction>}
 */
Instruction.from = function (source) {
  var pis = [], hit = null;
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
Instruction.clean = function (source) {
  return source.replace(this._PIEXP, "");
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



var Stripper = (function () {
  var Stripper = function Stripper() {};

  _classProps(Stripper, null, {
    strip: {
      writable: true,


      /**
       * Strip HTML and JS comments.
       * @param {string} script
       * @returns {string}
       */
      value: function (script) {
        script = this._stripout(script, "<!--", "-->");
        script = this._stripout(script, "/*", "*/");
        script = this._stripout(script, "^//", "\n");
        return script;
      }
    },
    _stripout: {
      writable: true,



      // Private ...................................................................

      /**
       * Screening the stripper.
       * @param {string} s1
       * @param {string} s2
       * @returns {string}
       */
      value: function (script, s1, s2) {
        var first = s1[0] === "^";
        s1 = first ? s1.substring(1) : s1;
        if (script.contains(s1) && script.contains(s2)) {
          script = this._stripall(script, s1, s2, first);
        }
        return script;
      }
    },
    _stripall: {
      writable: true,


      /**
       * Strip all comments with no concern about the context they appear in...
       * @param {string} s1
       * @param {string} s2
       * @param {boolean} first
       * @returns {string}
       */
      value: function (script, s1, s2, first) {
        var WHITESPACE = /\s/;
        var a1 = s1.split(""), a2 = s2.split(""), c1 = a1.shift(), c2 = a2.pop();
        s1 = a1.join("");
        s2 = a2.join("");
        var chars = null, pass = false, next = false, fits = function (i, l, s) {
          return chars.slice(i, l).join("") === s;
        }, ahead = function (i, s) {
          var l = s.length;
          return fits(i, i + l, s);
        }, prevs = function (i, s) {
          var l = s.length;
          return fits(i - l, i, s);
        }, begins = function (c, i) {
          var does = true;
          while (i > 0 && (c = script[--i]) !== "\n") {
            if (!c.match(WHITESPACE)) {
              does = false;
              break;
            }
          }
          return does;
        }, start = function (c, i) {
          var does = c === c1 && ahead(i + 1, s1);
          return does && first ? begins(c, i) : does;
        }, stops = function (c, i) {
          return c === c2 && prevs(i, s2);
        };
        chars = script.split("");
        return chars.map(function (chaa, i) {
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
            chaa = "";
          }
          if (next) {
            pass = false;
            next = false;
          }
          return chaa;
        }).join("");
      }
    }
  });

  return Stripper;
})();





var Runner = (function () {
  var Runner =

  /**
   * Let's go.
   */
  function Runner() {
    this.firstline = false;
    this.lastline = false;
    this.firstchar = false;
    this.lastchar = false;
    this._line = null;
    this._index = -1;
  };

  _classProps(Runner, null, {
    run: {
      writable: true,


      /**
       * Run script.
       * @param {Compiler} compiler
       * @param {string} script
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       */
      value: function (compiler, script, status, markup, output) {
        this._runlines(compiler, script.split("\n"), status, markup, output);
        // markup.debug(); // uncomment to debug Markup.js
      }
    },
    ahead: {
      writable: true,


      /**
       * Line text ahead equals given string?
       * @param {string} string
       * @returns {boolean}
       */
      value: function (string) {
        var line = this._line;
        var index = this._index;
        var i = index + 1;
        var l = string.length;
        return line.length > index + l && line.substring(i, i + l) === string;
      }
    },
    behind: {
      writable: true,


      /**
       * Line text behind equals given string?
       * @param {string} line
       * @param {number} index
       * @param {string} string
       * @returns {boolean}
       */
      value: function (string) {
        var line = this._line;
        var index = this._index;
        var length = string.length, start = index - length;
        return start >= 0 && line.substr(start, length) === string;
      }
    },
    lineahead: {
      writable: true,


      /**
       * Get line string from current position.
       * @returns {string}
       */
      value: function () {
        return this._line.substring(this._index + 1);
      }
    },
    skipahead: {
      writable: true,


      /**
       * Space-stripped line text at index equals string?
       * @param {string} string
       * @returns {boolean}
       */
      value: function (string) {
        console.error("TODO");
      }
    },
    _runlines: {
      writable: true,



      // Private ...................................................................

      /**
       * Run all lines.
       * @param {Compiler} compiler
       * @param {Array<String>} lines
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       */
      value: function (compiler, lines, status, markup, output) {
        var _this4 = this;
        var stop = lines.length - 1;
        lines.forEach(function (line, index) {
          _this4.firstline = index === 0;
          _this4.lastline = index === stop;
          _this4._runline(line, index, compiler, status, markup, output);
        });
      }
    },
    _runline: {
      writable: true,


      /**
       * Run single line.
       * @param {string} line
       * @param {number} index
       * @param {Compiler} compiler
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       */
      value: function (line, index, compiler, status, markup, output) {
        line = this._line = line.trim();
        if (line.length) {
          compiler.newline(line, this, status, markup, output);
          this._runchars(compiler, line.split(""), status, markup, output);
          compiler.endline(line, this, status, markup, output);
        }
      }
    },
    _runchars: {
      writable: true,


      /**
       * Run all chars.
       * @param {Compiler} compiler
       * @param {Array<String>} chars
       * @param {Status} status
       * @param {Markup} markup
       * @param {Output} output
       */
      value: function (compiler, chars, status, markup, output) {
        var _this5 = this;
        var stop = chars.length - 1;
        chars.forEach(function (c, i) {
          _this5._index = i;
          _this5.firstchar = i === 0;
          _this5.lastchar = i === stop;
          compiler.nextchar(c, _this5, status, markup, output);
        });
      }
    }
  });

  return Runner;
})();





var Result = (function () {
  var Result =

  /**
   * @param {string} body
   * @param {Array<String>} params
   * @param {Array<Instruction>} instructions
   */
  function Result(body, params, instructions) {
    this.functionstring = this._tofunctionstring(body, params);
    this.instructionset = instructions;
    this.errormessage = null;
  };

  _classProps(Result, null, {
    _tofunctionstring: {
      writable: true,


      /**
       * Compute single function declaration.
       * @param {string} script
       * @param @optional (Array<String>} params
       * @returns {string}
       */
      value: function (body, params) {
        if (params === undefined) params = [];
        var js;
        try {
          js = "'use strict'\n;" + body;
          js = new Function(params.join(","), body).toString();
          js = js.replace(/^function anonymous/, "function $edbml");
          js = js.replace(/\&quot;\&apos;/g, "&quot;");
          return js;
        } catch (exception) {
          this.instructionset = null;
          this.errormessage = exception.message;
          return this._tofallbackstring(body, params, exception.message);
        }
      }
    },
    _tofallbackstring: {
      writable: true,


      /**
       * Fallback for invalid source.
       * @param {string} script
       * @param (Array<String>} params
       * @returns {string}
       */
      value: function (body, params, exception) {
        body = this._emergencyformat(body, params);
        body = new Buffer(body).toString("base64");
        body = "gui.BlobLoader.loadScript ( document, atob (  '" + body + "' ));\n";
        body += "return '<p class=\"edberror\">" + exception + "</p>'";
        return this._tofunctionstring(body);
      }
    },
    _emergencyformat: {
      writable: true,


      /**
       * Format invalid source for readability.
       * @param {string} body
       * @returns {string}
       */
      value: function (body, params) {
        var result = "", tabs = "\t", init = null, last = null, fixt = null, hack = null;
        body.split("\n").forEach(function (line) {
          line = line.trim();
          init = line[0];
          last = line[line.length - 1];
          fixt = line.split("//")[0].trim();
          hack = fixt[fixt.length - 1];
          if ((init === "}" || init === "]") && tabs !== "") {
            tabs = tabs.slice(0, -1);
          }
          result += tabs + line + "\n";
          if (last === "{" || last === "[" || hack === "{" || hack === "[") {
            tabs += "\t";
          }
        });
        return ["function dysfunction (" + params + ") {", result, "}"].join("\n");
      }
    }
  });

  return Result;
})();





var Status = (function () {
  var Status = function Status() {
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
  };

  _classProps(Status, null, {
    gojs: {
      writable: true,


      /**
       * Go JS mode.
       */
      value: function () {
        this.mode = Status.MODE_JS;
      }
    },
    gohtml: {
      writable: true,


      /**
       * Go HTML mode.
       */
      value: function () {
        this.mode = Status.MODE_HTML;
      }
    },
    gotag: {
      writable: true,


      /**
       * Go tag mode.
       */
      value: function () {
        this.mode = Status.MODE_TAG;
      }
    },
    isjs: {
      writable: true,


      /**
       * Is JS mode?
       * @returns {boolean}
       */
      value: function () {
        return this.mode === Status.MODE_JS;
      }
    },
    ishtml: {
      writable: true,


      /**
       * Is HTML mode?
       * @returns {boolean}
       */
      value: function () {
        return this.mode === Status.MODE_HTML;
      }
    },
    istag: {
      writable: true,


      /**
       * Is tag mode?
       * @returns {boolean}
       */
      value: function () {
        return this.mode === Status.MODE_TAG;
      }
    }
  });

  return Status;
})();




// Static ...............................

Status.MODE_JS = "js";
Status.MODE_HTML = "html";
Status.MODE_TAG = "tag";



var Markup = (function () {
  var Markup = function Markup() {
    this.tag = null; // current tagname (if applicable)
    this.att = null; // current attname (not maintained!)

    this._is = null;
    this._buffer = null;
    this._quotes = null;
    this._snapshots = [];
    this._index = -1;
    this._go("txt");
  };

  _classProps(Markup, null, {
    next: {
      writable: true,
      value: function (c) {
        this._index++;
        switch (c) {
          case "<":
          case ">":
            this._ontag(c);
            break;
          case " ":
            this._onspace(c);
            break;
          case "=":
            this._onequal(c);
            break;
          case "\"":
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
    },
    debug: {
      writable: true,


      /**
       * Log snapshots to console (for debugging purpose). 
       * You can call this method over in class Runner.js 
       */
      value: function () {
        this._debug(this._snapshots);
      }
    },
    _ontag: {
      writable: true,




      // Private ...................................................................

      /**
       * Tag chars.
       * @param {string} c
       */
      value: function (c) {
        if (c === "<") {
          if (this._is === "txt") {
            this.tag = null;
            this._go("tag");
          }
        } else {
          if (this._is === "tag") {
            this.tag = this._buffer.trim();
          }
          switch (this._is) {
            case "att":
            case "tag":
              this.tag = null;
              this._go("txt");
              break;
          }
        }
      }
    },
    _onquote: {
      writable: true,


      /**
       * Quote chars. We may assume the author to use double 
       * quotes, single quotes and no quotes for attributes.
       * @param {string} c
       */
      value: function (c) {
        var previndex = this._index - 1;
        switch (this._is) {
          case "val":
            if (this._quotes) {
              if (this._quotes === c && this._prevchar !== "\\") {
                this._go("att");
              }
            } else if (this._was(previndex, "att")) {
              this._quotes = c;
            }
            break;
          default:
            this._buf(c);
            break;
        }
      }
    },
    _onspace: {
      writable: true,


      /**
       * Space chars.
       * TODO: Important: All sorts of (multiple) whitespace characters going on!
       * @param {string} c
       */
      value: function (c) {
        switch (this._is) {
          case "tag":
            this.tag = this._buffer.trim();
            this._go("att");
            break;
          case "val":
            if (!this._quotes) {
              this._go("att");
            }
            break;
          default:
            this._buf(c);
            break;
        }
      }
    },
    _onequal: {
      writable: true,


      /**
       * Equal sign.
       * @param {string} c
       */
      value: function (c) {
        if (this._is === "att") {
          this._go("val");
        } else {
          this._buf(c);
        }
      }
    },
    _buf: {
      writable: true,


      /**
       * Buffer char.
       * @param {string} c
       */
      value: function (c) {
        this._buffer += c;
      }
    },
    _go: {
      writable: true,


      /**
       * Take snapshot, clear the buffer and change to new mode.
       * @param {string} newis
       */
      value: function (newis) {
        if (this._is !== null) {
          this._snapshots.push([this._index, this._is, this._buffer]);
        }
        this._quotes = null;
        this._buffer = "";
        this._is = newis;
      }
    },
    _was: {
      writable: true,


      /**
       * Was type at index?
       * @param {number} index
       * @param {string} type
       */
      value: function (index, type) {
        var ix, it, match, snap, prev, snaps = this._snapshots;
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
    },
    _debug: {
      writable: true,



      // Deboogie ..................................................................

      /**
       * Quick and dirty debugging: The string 
       * in the console should look like HTML.
       * @param {Array<Array<string>>} snapshots
       */
      value: function (snapshots) {
        var index, is, was, buffer, yyy, next, end, tab = "\t", tabs = [];
        console.log(snapshots.reduce(function (html, snap) {
          index = snap[0];
          is = snap[1];
          buffer = snap[2];
          switch (is) {
            case "tag":
              if ((end = buffer[0] === "/")) {
                tabs.pop();
              }
              was = was === "txt" && yyy.trim().length ? "" : was;
              next = (was ? "\n" + tabs.join("") : "") + "<" + buffer;
              if (!end) {
                tabs.push(tab);
              }
              break;
            case "att":
              next = " " + buffer.trim();
              if (next === " ") {
                next = "";
              }
              break;
            case "val":
              next = "=\"" + buffer + "\"";
              break;
            case "txt":
              next = (was ? ">" : "") + buffer;
              break;
          }
          was = is;
          yyy = buffer;
          return html + next;
        }, "") + (was === "tag" ? ">" : ""));
      }
    }
  });

  return Markup;
})();




// Static ......................................................................

Markup.CONTEXT_TXT = "txt";
Markup.CONTEXT_ATT = "att";
Markup.CONTEXT_VAL = "val";



var Output =

/**
 * @param @optional {string} body
 */
function Output(body) {
  if (body === undefined) body = "";
  this.body = body;
  this.temp = null;
};





/**
 * @param {string} source
 * @param {Map<String,object>} options
 * @param {???} macros
 * @param {Map<String,object>} directives
 * @returns {string}
 */
exports.compile = function (edbml, options, macros, directives) {
  if (edbml.contains("<?input")) {
    return new ScriptCompiler().compile(edbml, options, macros, directives);
  } else {
    return new FunctionCompiler().compile(edbml, options, macros, directives);
  }
};