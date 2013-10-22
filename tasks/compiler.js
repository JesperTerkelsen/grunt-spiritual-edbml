'use strict';
// Source: tasks/build/tasks/src/lib/traceur/runtime.js
(function(global) {
if (global.$traceurRuntime) {
    return;
  }
  var $create = Object.create;
  var $defineProperty = Object.defineProperty;
  var $freeze = Object.freeze;
  var $getOwnPropertyNames = Object.getOwnPropertyNames;
  var $getPrototypeOf = Object.getPrototypeOf;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;
  var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  function nonEnum(value) {
    return {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true
    };
  }
  var method = nonEnum;
  function polyfillString(String) {
    Object.defineProperties(String.prototype, {
      startsWith: method(function(s) {
        return this.lastIndexOf(s, 0) === 0;
      }),
      endsWith: method(function(s) {
        var t = String(s);
        var l = this.length - t.length;
        return l >= 0 && this.indexOf(t, l) === l;
      }),
      contains: method(function(s) {
        return this.indexOf(s) !== - 1;
      }),
      toArray: method(function() {
        return this.split('');
      })
    });
    $defineProperty(String, 'raw', {
      value: function(callsite) {
        var raw = callsite.raw;
        var len = raw.length >>> 0;
        if (len === 0) return '';
        var s = '';
        var i = 0;
        while (true) {
          s += raw[i];
          if (i + 1 === len) return s;
          s += arguments[++i];
        }
      },
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  var counter = 0;
  function newUniqueString() {
    return '__$' + Math.floor(Math.random() * 1e9) + '$' + ++counter + '$__';
  }
  var nameRe = /^__\$(?:\d+)\$(?:\d+)\$__$/;
  var internalStringValueName = newUniqueString();
  function Name(string) {
    if (!string) string = newUniqueString();
    $defineProperty(this, internalStringValueName, {value: newUniqueString()});
    function toString() {
      return string;
    }
    $freeze(toString);
    $freeze(toString.prototype);
    var toStringDescr = method(toString);
    $defineProperty(this, 'toString', toStringDescr);
    this.public = $freeze($create(null, {toString: method($freeze(function toString() {
        return string;
      }))}));
    $freeze(this.public.toString.prototype);
    $freeze(this);
  }
  ;
  $freeze(Name);
  $freeze(Name.prototype);
  function assertName(val) {
    if (!NameModule.isName(val)) throw new TypeError(val + ' is not a Name');
    return val;
  }
  var elementDeleteName = new Name();
  var elementGetName = new Name();
  var elementSetName = new Name();
  var NameModule = $freeze({
    Name: function(str) {
      return new Name(str);
    },
    isName: function(x) {
      return x instanceof Name;
    },
    elementGet: elementGetName,
    elementSet: elementSetName,
    elementDelete: elementDeleteName
  });
  var filter = Array.prototype.filter.call.bind(Array.prototype.filter);
  function getOwnPropertyNames(object) {
    return filter($getOwnPropertyNames(object), function(str) {
      return !nameRe.test(str);
    });
  }
  function hasOwnProperty(name) {
    if (NameModule.isName(name) || nameRe.test(name)) return false;
    return $hasOwnProperty.call(this, name);
  }
  function elementDelete(object, name) {
    if (traceur.options.trapMemberLookup && hasPrivateNameProperty(object, elementDeleteName)) {
      return getProperty(object, elementDeleteName).call(object, name);
    }
    return deleteProperty(object, name);
  }
  function elementGet(object, name) {
    if (traceur.options.trapMemberLookup && hasPrivateNameProperty(object, elementGetName)) {
      return getProperty(object, elementGetName).call(object, name);
    }
    return getProperty(object, name);
  }
  function elementHas(object, name) {
    return has(object, name);
  }
  function elementSet(object, name, value) {
    if (traceur.options.trapMemberLookup && hasPrivateNameProperty(object, elementSetName)) {
      getProperty(object, elementSetName).call(object, name, value);
    } else {
      setProperty(object, name, value);
    }
    return value;
  }
  function assertNotName(s) {
    if (nameRe.test(s)) throw Error('Invalid access to private name');
  }
  function deleteProperty(object, name) {
    if (NameModule.isName(name)) return delete object[name[internalStringValueName]];
    if (nameRe.test(name)) return true;
    return delete object[name];
  }
  function getProperty(object, name) {
    if (NameModule.isName(name)) return object[name[internalStringValueName]];
    if (nameRe.test(name)) return undefined;
    return object[name];
  }
  function hasPrivateNameProperty(object, name) {
    return name[internalStringValueName]in Object(object);
  }
  function has(object, name) {
    if (NameModule.isName(name) || nameRe.test(name)) return false;
    return name in Object(object);
  }
  function setProperty(object, name, value) {
    if (NameModule.isName(name)) {
      var descriptor = $getPropertyDescriptor(object, [name[internalStringValueName]]);
      if (descriptor) object[name[internalStringValueName]] = value; else $defineProperty(object, name[internalStringValueName], nonEnum(value));
    } else {
      assertNotName(name);
      object[name] = value;
    }
  }
  function defineProperty(object, name, descriptor) {
    if (NameModule.isName(name)) {
      if (descriptor.enumerable) {
        descriptor = Object.create(descriptor, {enumerable: {value: false}});
      }
      $defineProperty(object, name[internalStringValueName], descriptor);
    } else {
      assertNotName(name);
      $defineProperty(object, name, descriptor);
    }
  }
  function $getPropertyDescriptor(obj, name) {
    while (obj !== null) {
      var result = $getOwnPropertyDescriptor(obj, name);
      if (result) return result;
      obj = $getPrototypeOf(obj);
    }
    return undefined;
  }
  function getPropertyDescriptor(obj, name) {
    if (NameModule.isName(name)) return undefined;
    assertNotName(name);
    return $getPropertyDescriptor(obj, name);
  }
  function polyfillObject(Object) {
    $defineProperty(Object, 'defineProperty', {value: defineProperty});
    $defineProperty(Object, 'deleteProperty', method(deleteProperty));
    $defineProperty(Object, 'getOwnPropertyNames', {value: getOwnPropertyNames});
    $defineProperty(Object, 'getProperty', method(getProperty));
    $defineProperty(Object, 'getPropertyDescriptor', method(getPropertyDescriptor));
    $defineProperty(Object, 'has', method(has));
    $defineProperty(Object, 'setProperty', method(setProperty));
    $defineProperty(Object.prototype, 'hasOwnProperty', {value: hasOwnProperty});
    function is(left, right) {
      if (left === right) return left !== 0 || 1 / left === 1 / right;
      return left !== left && right !== right;
    }
    $defineProperty(Object, 'is', method(is));
    function assign(target, source) {
      var props = $getOwnPropertyNames(source);
      var p, length = props.length;
      for (p = 0; p < length; p++) {
        target[props[p]] = source[props[p]];
      }
      return target;
    }
    $defineProperty(Object, 'assign', method(assign));
    function mixin(target, source) {
      var props = $getOwnPropertyNames(source);
      var p, descriptor, length = props.length;
      for (p = 0; p < length; p++) {
        descriptor = $getOwnPropertyDescriptor(source, props[p]);
        $defineProperty(target, props[p], descriptor);
      }
      return target;
    }
    $defineProperty(Object, 'mixin', method(mixin));
  }
  var iteratorName = new Name('iterator');
  var IterModule = {get iterator() {
      return iteratorName;
    }};
  function getIterator(collection) {
    return getProperty(collection, iteratorName).call(collection);
  }
  function returnThis() {
    return this;
  }
  function addIterator(object) {
    setProperty(object, iteratorName, returnThis);
    return object;
  }
  function polyfillArray(Array) {
    defineProperty(Array.prototype, IterModule.iterator, method(function() {
      var index = 0;
      var array = this;
      return {next: function() {
          if (index < array.length) {
            return {
              value: array[index++],
              done: false
            };
          }
          return {
            value: undefined,
            done: true
          };
        }};
    }));
  }
  function Deferred(canceller) {
    this.canceller_ = canceller;
    this.listeners_ = [];
  }
  function notify(self) {
    while (self.listeners_.length > 0) {
      var current = self.listeners_.shift();
      var currentResult = undefined;
      try {
        try {
          if (self.result_[1]) {
            if (current.errback) currentResult = current.errback.call(undefined, self.result_[0]);
          } else {
            if (current.callback) currentResult = current.callback.call(undefined, self.result_[0]);
          }
          current.deferred.callback(currentResult);
        } catch (err) {
          current.deferred.errback(err);
        }
      } catch (unused) {}
    }
  }
  function fire(self, value, isError) {
    if (self.fired_) throw new Error('already fired');
    self.fired_ = true;
    self.result_ = [value, isError];
    notify(self);
  }
  Deferred.prototype = {
    constructor: Deferred,
    fired_: false,
    result_: undefined,
    createPromise: function() {
      return {
        then: this.then.bind(this),
        cancel: this.cancel.bind(this)
      };
    },
    callback: function(value) {
      fire(this, value, false);
    },
    errback: function(err) {
      fire(this, err, true);
    },
    then: function(callback, errback) {
      var result = new Deferred(this.cancel.bind(this));
      this.listeners_.push({
        deferred: result,
        callback: callback,
        errback: errback
      });
      if (this.fired_) notify(this);
      return result.createPromise();
    },
    cancel: function() {
      if (this.fired_) throw new Error('already finished');
      var result;
      if (this.canceller_) {
        result = this.canceller_(this);
        if (!result instanceof Error) result = new Error(result);
      } else {
        result = new Error('cancelled');
      }
      if (!this.fired_) {
        this.result_ = [result, true];
        notify(this);
      }
    }
  };
  var modules = {
    get'@name'() {
      return NameModule;
    },
    get'@iter'() {
      return IterModule;
    }
  };
  var System = {
    get: function(name) {
      return modules[name] || null;
    },
    set: function(name, object) {
      modules[name] = object;
    }
  };
  function setupGlobals(global) {
    polyfillString(global.String);
    polyfillObject(global.Object);
    polyfillArray(global.Array);
    global.System = System;
    global.Deferred = Deferred;
  }
  setupGlobals(global);
  var runtime = {
    Deferred: Deferred,
    addIterator: addIterator,
    assertName: assertName,
    createName: NameModule.Name,
    deleteProperty: deleteProperty,
    elementDelete: elementDelete,
    elementGet: elementGet,
    elementHas: elementHas,
    elementSet: elementSet,
    getIterator: getIterator,
    getProperty: getProperty,
    setProperty: setProperty,
    setupGlobals: setupGlobals,
    has: has
  };
  global.$traceurRuntime = runtime;
})(typeof global !== 'undefined' ? global: this);



// Source: tasks/build/tasks/src/header.js
function extend(proto, props) {
  var resolved = Object.create(null);
  Object.keys(props).forEach(function(prop) {
    resolved[prop] = {
      value: props[prop],
      writable: true,
      enumerable: true,
      configurable: true
    };
  });
  return Object.create(proto, resolved);
}
function each(object, func, thisp) {
  return Object.keys(object).map(function(key) {
    return func.call(thisp, key, object[key]);
  });
}
function unique() {
  var ran = String(Math.random());
  return "key" + ran.slice(2, 11);
}



// Source: tasks/build/tasks/src/compilers/Compiler.js
var $__getDescriptors = function(object) {
  var descriptors = {}, name, names = Object.getOwnPropertyNames(object);
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    descriptors[name] = Object.getOwnPropertyDescriptor(object, name);
  }
  return descriptors;
}, $__createClassNoExtends = function(object, staticObject) {
  var ctor = object.constructor;
  Object.defineProperty(object, 'constructor', {enumerable: false});
  ctor.prototype = object;
  Object.defineProperties(ctor, $__getDescriptors(staticObject));
  return ctor;
};
var Compiler = function() {
  var $Compiler = ($__createClassNoExtends)({
    constructor: function() {},
    newline: function(line, runner, status, result) {
      status.last = line.length - 1;
      status.adds = line[0] === "+";
      status.cont = status.cont || (status.ishtml() && status.adds);
    },
    endline: function(line, runner, status, result) {
      if (status.ishtml()) {
        if (!status.cont) {
          result.body += "';\n";
          status.gojs();
        }
      } else {
        result.body += "\n";
      }
      status.cont = false;
    },
    nextchar: function(c, runner, status, result) {
      switch (status.mode) {
        case Status.MODE_JS:
          this._compilejs(c, runner, status, result);
          break;
        case Status.MODE_HTML:
          this._compilehtml(c, runner, status, result);
          break;
        case Status.MODE_TAG:
          this._compiletag(c, runner, status, result);
          break;
      }
      if (status.skip-- <= 0) {
        if (status.poke || status.geek) {
          result.temp += c;
        } else {
          if (!status.istag()) {
            result.body += c;
          }
        }
      }
    },
    _compile: function(script) {
      var runner = new Runner();
      var status = new Status();
      var result = new Result('"use strict";\n');
      runner.run(this, script, status, result);
      result.body += (status.ishtml() ? "';": "") + "\nreturn out.write ();";
      return result.format();
    },
    _compilejs: function(c, runner, status, result) {
      switch (c) {
        case "<":
          if (runner.firstchar) {
            var line = "JSHINT";
            var i = "JSHINT";
            var tag;
            if (false && (tag = this._tagstart(line))) {
              status.gotag();
              this._aaa(status, line, i);
            } else if (false && (tag = this._tagstop(line))) {
              status.gotag();
              this._bbb(status);
            } else {
              status.gohtml();
              status.spot = result.body.length - 1;
              result.body += "out.html += '";
            }
          }
          break;
        case "@":
          this._scriptatt(runner, status, result);
          break;
      }
    },
    _compilehtml: function(c, runner, status, result) {
      var special = status.peek || status.poke || status.geek;
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
              result.body += ") + '";
            }
            if (status.poke) {
              this._poke(status, result);
              status.poke = false;
              result.temp = null;
              status.spot = - 1;
              status.skip = 1;
              status.curl = 0;
            }
            if (status.geek) {
              this._geek(status, result);
              status.geek = false;
              result.temp = null;
              status.spot = - 1;
              status.skip = 1;
              status.curl = 0;
            }
          }
          break;
        case "$":
          if (!special && runner.ahead("{")) {
            if (runner.behind("gui.test=\"")) {
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
        case "#":
          if (!special && runner.ahead("{")) {
            status.poke = true;
            status.skip = 2;
            status.curl = 0;
            result.temp = "";
          }
          break;
        case "+":
          if (runner.firstchar) {
            status.skip = status.adds ? 1: 0;
          } else if (runner.lastchar) {
            status.cont = true;
            status.skip = 1;
          }
          break;
        case "'":
          if (!special) {
            result.body += "\\";
          }
          break;
        case "@":
          this._htmlatt(runner, status, result);
          break;
      }
    },
    _compiletag: function(status, c, i, line) {
      switch (c) {
        case "$":
          if (this._ahead(line, i, "{")) {
            status.refs = true;
            status.skip = 2;
          }
          break;
        case ">":
          status.gojs();
          status.skip = 1;
          break;
      }
    },
    _scriptatt: function(runner, status, result) {
      var attr = Compiler._ATTREXP;
      var rest, name;
      if (runner.behind("@")) {} else if (runner.ahead("@")) {
        result.body += "var att = new Att ();";
        status.skip = 2;
      } else {
        rest = runner.lineahead();
        name = attr.exec(rest)[0];
        if (name) {
          result.body += rest.replace(name, "att['" + name + "']");
          status.skip = rest.length;
        } else {
          throw "Bad @name: " + rest;
        }
      }
    },
    _htmlatt: function(runner, status, result) {
      var attr = Compiler._ATTREXP;
      var rest, name, dels, what;
      if (runner.behind("@")) {} else if (runner.behind("#{")) {
        console.error("todo");
      } else if (runner.ahead("@")) {
        result.body += "' + att._all () + '";
        status.skip = 2;
      } else {
        rest = runner.lineahead();
        name = attr.exec(rest)[0];
        dels = runner.behind("-");
        what = dels ? "att._pop": "att._out";
        result.body = dels ? result.body.substring(0, result.body.length - 1): result.body;
        result.body += "' + " + what + " ( '" + name + "' ) + '";
        status.skip = name.length + 1;
      }
    },
    _poke: function(status, result) {
      this._inject(status, result, Compiler._POKE);
    },
    _geek: function(status, result) {
      this._inject(status, result, Compiler._GEEK);
    },
    _inject: function(status, result, js) {
      var body = result.body, temp = result.temp, spot = status.spot, prev = body.substring(0, spot), next = body.substring(spot), name = unique();
      result.body = prev + "\n" + js.outline.replace("$name", name).replace("$temp", temp) + next + js.inline.replace("$name", name);
    }
  }, {});
  return $Compiler;
}();
Compiler._POKE = {
  outline: "var $name = edb.set ( function ( value, checked ) {\n$temp;\n}, this );",
  inline: "edb.go(event,&quot;\' + $name + \'&quot;);"
};
Compiler._GEEK = {
  outline: "var $name = edb.set ( function () {\nreturn $temp;\n}, this );",
  inline: "edb.get(&quot;\' + $name + \'&quot;);"
};
Compiler._ATTREXP = /^[^\d][a-zA-Z0-9-_\.]+/;



// Source: tasks/build/tasks/src/compilers/FunctionCompiler.js
var $__getProtoParent = function(superClass) {
  if (typeof superClass === 'function') {
    var prototype = superClass.prototype;
    if (Object(prototype) === prototype || prototype === null) return superClass.prototype;
  }
  if (superClass === null) return null;
  throw new TypeError();
}, $__createClass = function(object, staticObject, protoParent, superClass, hasConstructor) {
  var ctor = object.constructor;
  if (typeof superClass === 'function') ctor.__proto__ = superClass;
  if (!hasConstructor && protoParent === null) ctor = object.constructor = function() {};
  var descriptors = $__getDescriptors(object);
  descriptors.constructor.enumerable = false;
  ctor.prototype = Object.create(protoParent, descriptors);
  Object.defineProperties(ctor, $__getDescriptors(staticObject));
  return ctor;
};
var FunctionCompiler = function($__super) {
  var $__proto = $__getProtoParent($__super);
  var $FunctionCompiler = ($__createClass)({
    constructor: function() {
      this.source = null;
      this.dependencies = null;
      this.directives = null;
      this.sequence = ["_validate", "_extract", "_direct", "_declare", "_define", "_compile"];
      this._instructions = null;
      this._params = null;
      this._failed = false;
    },
    compile: function(source, directives) {
      this.directives = directives || {};
      this.source = source;
      this.dependencies = [];
      this._params = [];
      this._vars = [];
      var head = {
        declarations: {},
        functiondefs: []
      };
      this.sequence.forEach(function(step) {
        this.source = this[step](this.source, head);
      }, this);
      return this._result(this.source, this._params);
    },
    _result: function(body, params) {
      return new FunctionResult(body, params);
    },
    _validate: function(script) {
      if (FunctionCompiler._NESTEXP.test(script)) {
        throw "Nested EDBML dysfunction";
      }
      return script;
    },
    _direct: function(script) {
      return script;
    },
    _extract: function(script, head) {
      Instruction.from (script).forEach(function(pi) {
        this._instruct(pi);
      }, this);
      return Instruction.clean(script);
    },
    _instruct: function(pi) {
      var type = pi.type;
      var atts = pi.atts;
      var name = atts.name;
      switch (type) {
        case "param":
          this._params.push(name);
          break;
      }
    },
    _declare: function(script, head) {
      var funcs = [];
      this.dependencies.forEach(function(dep) {
        head.declarations[dep.name] = true;
        funcs.push(dep.name + " = get ( self, '" + dep.tempname() + "' );\n");
      }, this);
      if (funcs[0]) {
        head.functiondefs.push("( function functions ( get ) {\n" + funcs.join("") + "}( Function.get ));");
      }
      return script;
    },
    _define: function(script, head) {
      var vars = "", html = "var ";
      each(head.declarations, function(name) {
        vars += ", " + name;
      });
      if (this._params.indexOf("out") < 0) {
        html += "out = new edb.Out (), ";
      }
      if (this._params.indexOf("att") < 0) {
        html += "att = new edb.Att () ";
      }
      html += vars + ";\n";
      head.functiondefs.forEach(function(def) {
        html += def + "\n";
      });
      return html + script;
    },
    _source: function(source, params) {
      var lines = source.split("\n");
      lines.pop();
      var args = params.length ? "( " + params.join(", ") + " )": "()";
      return "function " + args + " {\n" + lines.join("\n") + "\n}";
    }
  }, {}, $__proto, $__super, true);
  return $FunctionCompiler;
}(Compiler);
FunctionCompiler._NESTEXP = /<script.*type=["']?text\/edbml["']?.*>([\s\S]+?)/g;



// Source: tasks/build/tasks/src/compilers/ScriptCompiler.js
var $__superDescriptor = function(proto, name) {
  if (!proto) throw new TypeError('super is null');
  return Object.getPropertyDescriptor(proto, name);
}, $__superCall = function(self, proto, name, args) {
  var descriptor = $__superDescriptor(proto, name);
  if (descriptor) {
    if ('value'in descriptor) return descriptor.value.apply(self, args);
    if (descriptor.get) return descriptor.get.call(self).apply(self, args);
  }
  throw new TypeError("Object has no method '" + name + "'.");
};
var ScriptCompiler = function($__super) {
  var $__proto = $__getProtoParent($__super);
  var $ScriptCompiler = ($__createClass)({
    constructor: function() {
      this.inputs = Object.create(null);
      $__superCall(this, $__proto, "constructor", []);
    },
    _result: function(body, params) {
      return new ScriptResult(body, params, this.inputs);
    },
    _instruct: function(pi) {
      $__superCall(this, $__proto, "_instruct", [pi]);
      var atts = pi.atts;
      switch (pi.type) {
        case "input":
          this.inputs[atts.name] = atts.type;
          break;
      }
    },
    _declare: function(script, head) {
      $__superCall(this, $__proto, "_declare", [script, head]);
      return this._declareinputs(script, head);
    },
    _declareinputs: function(script, head) {
      var defs = [];
      each(this.inputs, function(name, type) {
        head.declarations[name] = true;
        defs.push(name + " = get ( " + type + " );\n");
      }, this);
      if (defs[0]) {
        head.functiondefs.push("( function inputs ( get ) {\n" + defs.join("") + "})( this.script.inputs );");
      }
      return script;
    }
  }, {}, $__proto, $__super, true);
  return $ScriptCompiler;
}(FunctionCompiler);



// Source: tasks/build/tasks/src/helpers/Instruction.js
function Instruction(pi) {
  this.atts = Object.create(null);
  this.type = pi.split("<?")[1].split(" ")[0];
  var hit, atexp = Instruction._ATEXP;
  while ((hit = atexp.exec(pi))) {
    var n = hit[1], v = hit[2];
    this.atts[n] = v;
  }
}
Instruction.prototype = {
  type: null,
  atts: null,
  toString: function() {
    return "[object Instruction]";
  }
};
Instruction.from = function(source) {
  var pis = [], hit = null;
  while ((hit = this._PIEXP.exec(source))) {
    pis.push(new Instruction(hit[0]));
  }
  return pis;
};
Instruction.clean = function(source) {
  return source.replace(this._PIEXP, "");
};
Instruction._PIEXP = /<\?.[^>?]+\?>/g;
Instruction._ATEXP = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g;



// Source: tasks/build/tasks/src/helpers/Runner.js
function Runner() {}
Runner.prototype = {
  firstline: false,
  lastline: false,
  firstchar: false,
  lastchar: false,
  run: function(compiler, script, status, result) {
    this._runlines(compiler, script.split("\n"), status, result);
  },
  ahead: function(string) {
    var line = this._line;
    var index = this._index;
    var i = index + 1;
    var l = string.length;
    return line.length > index + l && line.substring(i, i + l) === string;
  },
  behind: function(string) {
    var line = this._line;
    var index = this._index;
    var length = string.length, start = index - length;
    return start >= 0 && line.substr(start, length) === string;
  },
  lineahead: function() {
    return this._line.substring(this._index + 1);
  },
  skipahead: function(string) {
    console.error("TODO");
  },
  _line: null,
  _index: - 1,
  _runlines: function(compiler, lines, status, result) {
    var stop = lines.length - 1;
    lines.forEach(function(line, index) {
      this.firstline = index === 0;
      this.lastline = index === stop;
      this._runline(line, index, compiler, status, result);
    }, this);
  },
  _runline: function(line, index, compiler, status, result) {
    line = this._line = line.trim();
    if (line.length) {
      compiler.newline(line, this, status, result);
      this._runchars(compiler, line.split(""), status, result);
      compiler.endline(line, this, status, result);
    }
  },
  _runchars: function(compiler, chars, status, result) {
    var stop = chars.length - 1;
    chars.forEach(function(c, i) {
      this._index = i;
      this.firstchar = i === 0;
      this.lastchar = i === stop;
      compiler.nextchar(c, this, status, result);
    }, this);
  }
};



// Source: tasks/build/tasks/src/helpers/Result.js
function Result(body) {
  this.body = body || "";
}
Result.prototype = {
  body: null,
  temp: null,
  format: function() {
    return Result.format(this.body);
  }
};
Result.format = function(body) {
  return body;
};



// Source: tasks/build/tasks/src/helpers/Status.js
function Status() {
  this.conf = [];
}
Status.MODE_JS = "js";
Status.MODE_HTML = "html";
Status.MODE_TAG = "tag";
Status.prototype = {
  mode: Status.MODE_JS,
  peek: false,
  poke: false,
  cont: false,
  adds: false,
  func: null,
  conf: null,
  curl: null,
  skip: 0,
  last: 0,
  spot: 0,
  indx: 0,
  refs: false,
  isjs: function() {
    return this.mode === Status.MODE_JS;
  },
  ishtml: function() {
    return this.mode === Status.MODE_HTML;
  },
  istag: function() {
    return this.mode === Status.MODE_TAG;
  },
  gojs: function() {
    this.mode = Status.MODE_JS;
  },
  gohtml: function() {
    this.mode = Status.MODE_HTML;
  },
  gotag: function() {
    this.mode = Status.MODE_TAG;
  }
};



// Source: tasks/build/tasks/src/results/FunctionResult.js
var FunctionResult = function() {
  var $FunctionResult = ($__createClassNoExtends)({
    constructor: function(body, params) {
      this.runnable = this._torunnable(body, params);
      this.type = "function";
    },
    _torunnable: function(body, params) {
      try {
        params = Array.isArray(params) ? params.join(","): "";
        return new Function(params, body).toString();
      } catch (exception) {
        console.error("Source dysfunction", body);
        console.trace(exception);
      }
    }
  }, {});
  return $FunctionResult;
}();



// Source: tasks/build/tasks/src/results/ScriptResult.js
var ScriptResult = function($__super) {
  var $__proto = $__getProtoParent($__super);
  var $ScriptResult = ($__createClass)({constructor: function(body, params, inputs) {
      $__superCall(this, $__proto, "constructor", [body, params]);
      this.inputs = inputs;
      this.type = "script";
    }}, {}, $__proto, $__super, true);
  return $ScriptResult;
}(FunctionResult);



// Source: tasks/build/tasks/src/footer.js
exports.compile = function(edbml, options) {
  if (options.script) {
    return new ScriptCompiler().compile(edbml);
  } else {
    return new FunctionCompiler().compile(edbml);
  }
};
