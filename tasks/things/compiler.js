"use strict";
// Source: build/compiler-es5.js
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
 * @param {String} string
 * @returns {object}
 */
function cast(string) {
  var result = String(string);
  switch (result) {
  case 'null':
    result = null;
    break;
  case 'true':
  case 'false':
    result = result === 'true';
    break;
  default:
    if (String(parseInt(result, 10)) === result) {
      result = parseInt(result, 10);
    } else if (String(parseFloat(result)) === result) {
      result = parseFloat(result);
    }
    break;
  }
  return result === '' ? true : result;
}
/**
 * Generate unique key.
 * Note: Key structure must be kept in sync with {gui.KeyMaster#generatekey}.
 * @returns {String}
 */
var generateKey = function () {
  var keys = {};
  return function () {
    var ran = Math.random().toString();
    var key = 'key' + ran.slice(2, 11);
    if (keys[key]) {
      key = generateKey();
    } else {
      keys[key] = true;
    }
    return key;
  };
}();
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
var Compiler = function () {
  function Compiler() {
    this._keyindex = 1;
  }
  Compiler.prototype.newline = function (line, runner, status, output) {
    status.last = line.length - 1;
    status.adds = line[0] === '+';
    status.cont = status.cont || status.ishtml() && status.adds;
  };
  Compiler.prototype.endline = function (line, runner, status, output) {
    if (status.ishtml()) {
      if (!status.cont) {
        output.body += '\';\n';
        status.gojs();
      }
    } else {
      output.body += '\n';
    }
    status.cont = false;
  };
  Compiler.prototype.nextchar = function (c, runner, status, output) {
    switch (status.mode) {
    case Status.MODE_JS:
      this._compilejs(c, runner, status, output);
      break;
    case Status.MODE_HTML:
      this._compilehtml(c, runner, status, output);
      break;
    case Status.MODE_TAG:
      this._compiletag(c, runner, status, output);
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
  };
  Compiler.prototype._compile = function (script) {
    var runner = new Runner();
    var status = new Status();
    var output = new Output('\'use strict\';\n');
    runner.run(this, script, status, output);
    output.body += (status.ishtml() ? '\';' : '') + '\nreturn out.write ();';
    return output.body;
  };
  Compiler.prototype._compilejs = function (c, runner, status, output) {
    switch (c) {
    case '<':
      if (runner.firstchar) {
        status.gohtml();
        status.spot = output.body.length - 1;
        output.body += 'out.html += \'';
      }
      break;
    case '@':
      this._scriptatt(runner, status, output);
      break;
    }
  };
  Compiler.prototype._compilehtml = function (c, runner, status, output) {
    var special = status.peek || status.poke || status.geek;
    switch (c) {
    case '{':
      if (special) {
        status.curl++;
      }
      break;
    case '}':
      if (--status.curl === 0) {
        if (status.peek) {
          status.peek = false;
          status.skip = 1;
          status.curl = 0;
          output.body += ') + \'';
        }
        if (status.poke) {
          this._poke(status, output);
          status.poke = false;
          output.temp = null;
          status.skip = 1;
          status.curl = 0;
        }
        if (status.geek) {
          this._geek(status, output);
          status.geek = false;
          output.temp = null;
          status.skip = 1;
          status.curl = 0;
        }
      }
      break;
    case '$':
      if (!special && runner.ahead('{')) {
        status.peek = true;
        status.skip = 2;
        status.curl = 0;
        output.body += '\' + (';
      }
      break;
    case '#':
      if (!special && runner.ahead('{')) {
        status.poke = true;
        status.skip = 2;
        status.curl = 0;
        output.temp = '';
      }
      break;
    case '?':
      if (!special && runner.ahead('{')) {
        status.geek = true;
        status.skip = 2;
        status.curl = 0;
        output.temp = '';
      }
      break;
    case '+':
      if (runner.firstchar) {
        status.skip = status.adds ? 1 : 0;
      } else if (runner.lastchar) {
        status.cont = true;
        status.skip = 1;
      }
      break;
    case '\'':
      if (!special) {
        output.body += '\\';
      }
      break;
    case '@':
      this._htmlatt(runner, status, output);
      break;
    }
  };
  Compiler.prototype._compiletag = function (status, c, i, line) {
    switch (c) {
    case '$':
      if (this._ahead(line, i, '{')) {
        status.refs = true;
        status.skip = 2;
      }
      break;
    case '>':
      status.gojs();
      status.skip = 1;
      break;
    }
  };
  Compiler.prototype._scriptatt = function (runner, status, output) {
    var attr = Compiler._ATTREXP;
    var rest, name;
    if (runner.behind('@')) {
    } else if (runner.ahead('@')) {
      output.body += 'var att = new Att();';
      status.skip = 2;
    } else {
      rest = runner.lineahead();
      name = attr.exec(rest)[0];
      if (name) {
        output.body += rest.replace(name, 'att[\'' + name + '\']');
        status.skip = rest.length + 1;
      } else {
        throw 'Bad @name: ' + rest;
      }
    }
  };
  Compiler.prototype._htmlatt = function (runner, status, output) {
    var attr = Compiler._ATTREXP;
    var rest, name, dels, what;
    if (runner.behind('@')) {
    } else if (runner.behind('#{')) {
      console.error('todo');
    } else if (runner.ahead('@')) {
      output.body += '\' + att._all () + \'';
      status.skip = 2;
    } else {
      rest = runner.lineahead();
      name = attr.exec(rest)[0];
      dels = runner.behind('-');
      what = dels ? 'att._pop' : 'att._out';
      output.body = dels ? output.body.substring(0, output.body.length - 1) : output.body;
      output.body += '\' + ' + what + ' ( \'' + name + '\' ) + \'';
      status.skip = name.length + 1;
    }
  };
  Compiler.prototype._poke = function (status, output) {
    this._inject(status, output, Compiler._POKE);
  };
  Compiler.prototype._geek = function (status, output) {
    this._inject(status, output, Compiler._GEEK);
  };
  Compiler.prototype._inject = function (status, output, js) {
    var body = output.body, temp = output.temp, spot = status.spot, prev = body.substring(0, spot), next = body.substring(spot), name = '$edb' + this._keyindex++;
    // this._scriptid + 
    var outl = js.outline.replace('$name', name).replace('$temp', temp);
    output.body = prev + '\n' + outl + next + js.inline.replace('$name', name);
    status.spot += outl.length + 1;
  };
  return Compiler;
}();
// Static ......................................................................
/**
 * Poke.
 * @type {String}
 */
Compiler._POKE = {
  outline: 'var $name = edb.$set(function(value, checked) {\n$temp;\n}, this);',
  inline: 'edb.$run(event,&quot;\' + $name + \'&quot;);'
};
/**
 * Geek.
 * @type {String}
 */
Compiler._GEEK = {
  outline: 'var $name = edb.$set(function() {\nreturn $temp;\n}, this);',
  inline: 'edb.$get(&quot;\' + $name + \'&quot;);'
};
/**
 * Matches a qualified attribute name (class,id,src,href) allowing
 * underscores, dashes and dots while not starting with a number.
 * TODO: class and id may start with a number nowadays!!!!!!!!!!!!
 * TODO: https://github.com/jshint/jshint/issues/383
 * @type {RegExp}
 */
Compiler._ATTREXP = /^[^\d][a-zA-Z0-9-_\.]+/;
var FunctionCompiler = function (Compiler) {
  function FunctionCompiler() {
    Compiler.call(this);
    /**
		 * Compile sequence.
		 * @type {Array<string>}
		 */
    this._sequence = [
      this._uncomment,
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
  FunctionCompiler.prototype = Object.create(Compiler.prototype, {
    constructor: {
      value: FunctionCompiler,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  FunctionCompiler.prototype.compile = function (source, directives, scriptid) {
    this._directives = directives || {};
    this._params = [];
    var head = {
      declarations: {},
      // Map<String,boolean>
      functiondefs: []  // Array<String>
    };
    source = this._sequence.reduce(function (s, step) {
      return step.call(this, s, head);
    }.bind(this), source);
    return new Result(source, this._params, this._instructions);
  };
  FunctionCompiler.prototype._uncomment = function (script) {
    script = this._stripout(script, '<!--', '-->');
    script = this._stripout(script, '/*', '*/');
    return script;
  };
  FunctionCompiler.prototype._stripout = function (script, s1, s2) {
    var a1 = s1.split(''), a2 = s2.split(''), c1 = a1.shift(), c2 = a2.shift();
    s1 = a1.join('');
    s2 = a2.join('');
    var chars = null, pass = false, next = false, fits = function (i, l, s) {
        return chars.slice(i, l).join('') === s;
      }, ahead = function (i, s) {
        var l = s.length;
        return fits(i, i + l, s);
      }, prevs = function (i, s) {
        var l = s.length;
        return fits(i - l, i, s);
      }, start = function (c, i) {
        return c === c1 && ahead(i + 1, s1);
      }, stops = function (c, i) {
        return c === c2 && prevs(i, s2);
      };
    if (script.contains('<!--')) {
      chars = script.split('');
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
  };
  FunctionCompiler.prototype._validate = function (script) {
    if (FunctionCompiler._NESTEXP.test(script)) {
      throw 'Nested EDBML dysfunction';
    }
    return script;
  };
  FunctionCompiler.prototype._direct = function (script) {
    return script;
  };
  FunctionCompiler.prototype._extract = function (script, head) {
    Instruction.from(script).forEach(function (pi) {
      this._instructions = this._instructions || [];
      this._instructions.push(pi);
      this._instruct(pi);
    }.bind(this));
    return Instruction.clean(script);
  };
  FunctionCompiler.prototype._instruct = function (pi) {
    var type = pi.tag;
    var atts = pi.attributes;
    var name = atts.name;
    switch (type) {
    case 'param':
      this._params.push(name);
      break;
    }
  };
  FunctionCompiler.prototype._define = function (script, head) {
    var vars = '', html = 'var ';
    each(head.declarations, function (name) {
      vars += ', ' + name;
    });
    if (this._params.indexOf('out') < 0) {
      html += 'out = $function.$out, ';
    }
    html += 'att = new edb.Att() ';
    html += vars + ';\n';
    head.functiondefs.forEach(function (def) {
      html += def + '\n';
    });
    return html + script;
  };
  FunctionCompiler.prototype._source = function (source, params) {
    var lines = source.split('\n');
    lines.pop();
    // empty line :/
    var args = params.length ? '( ' + params.join(', ') + ' )' : '()';
    return 'function ' + args + ' {\n' + lines.join('\n') + '\n}';
  };
  return FunctionCompiler;
}(Compiler);
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
var ScriptCompiler = function (FunctionCompiler) {
  function ScriptCompiler() {
    FunctionCompiler.call(this);
    this.inputs = Object.create(null);
    this._sequence.splice(4, 0, this._declare);
  }
  ScriptCompiler.prototype = Object.create(FunctionCompiler.prototype, {
    constructor: {
      value: ScriptCompiler,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  ScriptCompiler.prototype._instruct = function (pi) {
    FunctionCompiler.prototype._instruct.call(this, pi);
    var atts = pi.attributes;
    switch (pi.tag) {
    case 'input':
      this.inputs[atts.name] = atts.type;
      break;
    }
  };
  ScriptCompiler.prototype._declare = function (script, head) {
    var defs = [];
    each(this.inputs, function (name, type) {
      head.declarations[name] = true;
      defs.push(name + ' = get(' + type + ');\n');
    }, this);
    if (defs[0]) {
      head.functiondefs.push('(function inputs(get) {\n' + defs.join('') + '}(this.script.inputs));');
    }
    return script;
  };
  return ScriptCompiler;
}(FunctionCompiler);
var Instruction = function () {
  function Instruction(pi) {
    this.tag = pi.split('<?')[1].split(' ')[0];
    // TODO: regexp this
    this.attributes = Object.create(null);
    var hit, atexp = Instruction._ATEXP;
    while (hit = atexp.exec(pi)) {
      var n = hit[1], v = hit[2];
      this.attributes[n] = cast(v);
    }
  }
  return Instruction;
}();
// STATICS .............................................................................
/**
 * Extract processing instructions from source.
 * @param {String} source
 * @returns {Array<Instruction>}
 */
Instruction.from = function (source) {
  var pis = [], hit = null;
  while (hit = this._PIEXP.exec(source)) {
    pis.push(new Instruction(hit[0]));
  }
  return pis;
};
/**
 * Remove processing instructions from source.
 * @param {String} source
 * @returns {String}
 */
Instruction.clean = function (source) {
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
var Runner = function () {
  function Runner() {
    this.firstline = false;
    this.lastline = false;
    this.firstchar = false;
    this.lastchar = false;
    this._line = null;
    this._index = -1;
  }
  Runner.prototype.run = function (compiler, script, status, output) {
    this._runlines(compiler, script.split('\n'), status, output);
  };
  Runner.prototype.ahead = function (string) {
    var line = this._line;
    var index = this._index;
    var i = index + 1;
    var l = string.length;
    return line.length > index + l && line.substring(i, i + l) === string;
  };
  Runner.prototype.behind = function (string) {
    var line = this._line;
    var index = this._index;
    var length = string.length, start = index - length;
    return start >= 0 && line.substr(start, length) === string;
  };
  Runner.prototype.lineahead = function () {
    return this._line.substring(this._index + 1);
  };
  Runner.prototype.skipahead = function (string) {
    console.error('TODO');
  };
  Runner.prototype._runlines = function (compiler, lines, status, output) {
    var stop = lines.length - 1;
    lines.forEach(function (line, index) {
      this.firstline = index === 0;
      this.lastline = index === stop;
      this._runline(line, index, compiler, status, output);
    }.bind(this));
  };
  Runner.prototype._runline = function (line, index, compiler, status, output) {
    line = this._line = line.trim();
    if (line.length) {
      compiler.newline(line, this, status, output);
      this._runchars(compiler, line.split(''), status, output);
      compiler.endline(line, this, status, output);
    }
  };
  Runner.prototype._runchars = function (compiler, chars, status, output) {
    var stop = chars.length - 1;
    chars.forEach(function (c, i) {
      this._index = i;
      this.firstchar = i === 0;
      this.lastchar = i === stop;
      compiler.nextchar(c, this, status, output);
    }.bind(this));
  };
  return Runner;
}();
var Result = function () {
  function Result(body, params, instructions) {
    this.functionstring = this._tofunctionstring(body, params);
    this.instructionset = instructions;
    this.errormessage = null;
  }
  Result.prototype._tofunctionstring = function (body, params) {
    if (params === undefined)
      params = [];
    try {
      var js = new Function(params.join(','), body).toString();
      js = js.replace(/^function anonymous/, 'function $function');
      js = js.replace(/\&quot;\&apos;/g, '&quot;');
      return js;
    } catch (exception) {
      this.instructionset = null;
      this.errormessage = exception.message;
      return this._tofallbackstring(body, params, exception.message);
    }
  };
  Result.prototype._tofallbackstring = function (body, params, exception) {
    body = this._emergencyformat(body, params);
    body = new Buffer(body).toString('base64');
    body = 'gui.BlobLoader.loadScript ( document, atob (  \'' + body + '\' ));\n';
    body += 'return \'<p class="edberror">' + exception + '</p>\'';
    return this._tofunctionstring(body);
  };
  Result.prototype._emergencyformat = function (body, params) {
    var result = '', tabs = '\t', init = null, last = null, fixt = null, hack = null;
    body.split('\n').forEach(function (line) {
      line = line.trim();
      init = line[0];
      last = line[line.length - 1];
      fixt = line.split('//')[0].trim();
      hack = fixt[fixt.length - 1];
      if ((init === '}' || init === ']') && tabs !== '') {
        tabs = tabs.slice(0, -1);
      }
      result += tabs + line + '\n';
      if (last === '{' || last === '[' || hack === '{' || hack === '[') {
        tabs += '\t';
      }
    });
    return [
      'function dysfunction (' + params + ') {',
      result,
      '}'
    ].join('\n');
  };
  return Result;
}();
var Status = function () {
  function Status() {
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
  Status.prototype.gojs = function () {
    this.mode = Status.MODE_JS;
  };
  Status.prototype.gohtml = function () {
    this.mode = Status.MODE_HTML;
  };
  Status.prototype.gotag = function () {
    this.mode = Status.MODE_TAG;
  };
  Status.prototype.isjs = function () {
    return this.mode === Status.MODE_JS;
  };
  Status.prototype.ishtml = function () {
    return this.mode === Status.MODE_HTML;
  };
  Status.prototype.istag = function () {
    return this.mode === Status.MODE_TAG;
  };
  return Status;
}();
// Static ...............................
Status.MODE_JS = 'js';
Status.MODE_HTML = 'html';
Status.MODE_TAG = 'tag';
var Output = function () {
  function Output(body) {
    if (body === undefined)
      body = '';
    this.body = body;
    this.temp = null;
  }
  return Output;
}();
/**
 * @param {String} source
 * @param {Map<String,object>} options
 * @param {string} scriptid
 * @returns {String}
 */
exports.compile = function (edbml, options) {
  // scriptid
  if (edbml.contains('<?input')) {
    return new ScriptCompiler().compile(edbml, options  /*scriptid*/);
  } else {
    return new FunctionCompiler().compile(edbml, options  /*scriptid*/);
  }
};