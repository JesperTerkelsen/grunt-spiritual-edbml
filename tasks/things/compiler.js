"use strict";
// Source: src/lib/traceur-runtime.js
(function(global) {
if (global.$traceurRuntime) {
		return;
	}
	var $Object = Object;
	var $TypeError = TypeError;
	var $create = $Object.create;
	var $defineProperties = $Object.defineProperties;
	var $defineProperty = $Object.defineProperty;
	var $freeze = $Object.freeze;
	var $getOwnPropertyDescriptor = $Object.getOwnPropertyDescriptor;
	var $getOwnPropertyNames = $Object.getOwnPropertyNames;
	var $getPrototypeOf = $Object.getPrototypeOf;
	var $hasOwnProperty = $Object.prototype.hasOwnProperty;
	var $toString = $Object.prototype.toString;
	var $preventExtensions = Object.preventExtensions;
	var $seal = Object.seal;
	var $isExtensible = Object.isExtensible;
	function nonEnum(value) {
		return {
			configurable: true,
			enumerable: false,
			value: value,
			writable: true
		};
	}
	var types = {
		void: function voidType() {},
		any: function any() {},
		string: function string() {},
		number: function number() {},
		boolean: function boolean() {}
	};
	var method = nonEnum;
	var counter = 0;
	function newUniqueString() {
		return '__$' + Math.floor(Math.random() * 1e9) + '$' + ++counter + '$__';
	}
	var symbolInternalProperty = newUniqueString();
	var symbolDescriptionProperty = newUniqueString();
	var symbolDataProperty = newUniqueString();
	var symbolValues = $create(null);
	function isSymbol(symbol) {
		return typeof symbol === 'object' && symbol instanceof SymbolValue;
	}
	function typeOf(v) {
		if (isSymbol(v))
			return 'symbol';
		return typeof v;
	}
	function Symbol(description) {
		var value = new SymbolValue(description);
		if (!(this instanceof Symbol))
			return value;
		throw new TypeError('Symbol cannot be new\'ed');
	}
	$defineProperty(Symbol.prototype, 'constructor', nonEnum(Symbol));
	$defineProperty(Symbol.prototype, 'toString', method(function() {
		var symbolValue = this[symbolDataProperty];
		if (!getOption('symbols'))
			return symbolValue[symbolInternalProperty];
		if (!symbolValue)
			throw TypeError('Conversion from symbol to string');
		var desc = symbolValue[symbolDescriptionProperty];
		if (desc === undefined)
			desc = '';
		return 'Symbol(' + desc + ')';
	}));
	$defineProperty(Symbol.prototype, 'valueOf', method(function() {
		var symbolValue = this[symbolDataProperty];
		if (!symbolValue)
			throw TypeError('Conversion from symbol to string');
		if (!getOption('symbols'))
			return symbolValue[symbolInternalProperty];
		return symbolValue;
	}));
	function SymbolValue(description) {
		var key = newUniqueString();
		$defineProperty(this, symbolDataProperty, {value: this});
		$defineProperty(this, symbolInternalProperty, {value: key});
		$defineProperty(this, symbolDescriptionProperty, {value: description});
		freeze(this);
		symbolValues[key] = this;
	}
	$defineProperty(SymbolValue.prototype, 'constructor', nonEnum(Symbol));
	$defineProperty(SymbolValue.prototype, 'toString', {
		value: Symbol.prototype.toString,
		enumerable: false
	});
	$defineProperty(SymbolValue.prototype, 'valueOf', {
		value: Symbol.prototype.valueOf,
		enumerable: false
	});
	var hashProperty = newUniqueString();
	var hashPropertyDescriptor = {value: undefined};
	var hashObjectProperties = {
		hash: {value: undefined},
		self: {value: undefined}
	};
	var hashCounter = 0;
	function getOwnHashObject(object) {
		var hashObject = object[hashProperty];
		if (hashObject && hashObject.self === object)
			return hashObject;
		if ($isExtensible(object)) {
			hashObjectProperties.hash.value = hashCounter++;
			hashObjectProperties.self.value = object;
			hashPropertyDescriptor.value = $create(null, hashObjectProperties);
			$defineProperty(object, hashProperty, hashPropertyDescriptor);
			return hashPropertyDescriptor.value;
		}
		return undefined;
	}
	function freeze(object) {
		getOwnHashObject(object);
		return $freeze.apply(this, arguments);
	}
	function preventExtensions(object) {
		getOwnHashObject(object);
		return $preventExtensions.apply(this, arguments);
	}
	function seal(object) {
		getOwnHashObject(object);
		return $seal.apply(this, arguments);
	}
	Symbol.iterator = Symbol();
	freeze(SymbolValue.prototype);
	function toProperty(name) {
		if (isSymbol(name))
			return name[symbolInternalProperty];
		return name;
	}
	function getOwnPropertyNames(object) {
		var rv = [];
		var names = $getOwnPropertyNames(object);
		for (var i = 0; i < names.length; i++) {
			var name = names[i];
			if (!symbolValues[name] && name !== hashProperty)
				rv.push(name);
		}
		return rv;
	}
	function getOwnPropertyDescriptor(object, name) {
		return $getOwnPropertyDescriptor(object, toProperty(name));
	}
	function getOwnPropertySymbols(object) {
		var rv = [];
		var names = $getOwnPropertyNames(object);
		for (var i = 0; i < names.length; i++) {
			var symbol = symbolValues[names[i]];
			if (symbol)
				rv.push(symbol);
		}
		return rv;
	}
	function hasOwnProperty(name) {
		return $hasOwnProperty.call(this, toProperty(name));
	}
	function getOption(name) {
		return global.traceur && global.traceur.options[name];
	}
	function setProperty(object, name, value) {
		var sym,
				desc;
		if (isSymbol(name)) {
			sym = name;
			name = name[symbolInternalProperty];
		}
		object[name] = value;
		if (sym && (desc = $getOwnPropertyDescriptor(object, name)))
			$defineProperty(object, name, {enumerable: false});
		return value;
	}
	function defineProperty(object, name, descriptor) {
		if (isSymbol(name)) {
			if (descriptor.enumerable) {
				descriptor = $create(descriptor, {enumerable: {value: false}});
			}
			name = name[symbolInternalProperty];
		}
		$defineProperty(object, name, descriptor);
		return object;
	}
	function polyfillObject(Object) {
		$defineProperty(Object, 'defineProperty', {value: defineProperty});
		$defineProperty(Object, 'getOwnPropertyNames', {value: getOwnPropertyNames});
		$defineProperty(Object, 'getOwnPropertyDescriptor', {value: getOwnPropertyDescriptor});
		$defineProperty(Object.prototype, 'hasOwnProperty', {value: hasOwnProperty});
		$defineProperty(Object, 'freeze', {value: freeze});
		$defineProperty(Object, 'preventExtensions', {value: preventExtensions});
		$defineProperty(Object, 'seal', {value: seal});
		Object.getOwnPropertySymbols = getOwnPropertySymbols;
		function is(left, right) {
			if (left === right)
				return left !== 0 || 1 / left === 1 / right;
			return left !== left && right !== right;
		}
		$defineProperty(Object, 'is', method(is));
		function assign(target, source) {
			var props = $getOwnPropertyNames(source);
			var p,
					length = props.length;
			for (p = 0; p < length; p++) {
				var name = props[p];
				if (name === hashProperty)
					continue;
				target[name] = source[name];
			}
			return target;
		}
		$defineProperty(Object, 'assign', method(assign));
		function mixin(target, source) {
			var props = $getOwnPropertyNames(source);
			var p,
					descriptor,
					length = props.length;
			for (p = 0; p < length; p++) {
				var name = props[p];
				if (name === hashProperty)
					continue;
				descriptor = $getOwnPropertyDescriptor(source, props[p]);
				$defineProperty(target, props[p], descriptor);
			}
			return target;
		}
		$defineProperty(Object, 'mixin', method(mixin));
	}
	function exportStar(object) {
		for (var i = 1; i < arguments.length; i++) {
			var names = $getOwnPropertyNames(arguments[i]);
			for (var j = 0; j < names.length; j++) {
				var name = names[j];
				if (name === hashProperty)
					continue;
				(function(mod, name) {
					$defineProperty(object, name, {
						get: function() {
							return mod[name];
						},
						enumerable: true
					});
				})(arguments[i], names[j]);
			}
		}
		return object;
	}
	function isObject(x) {
		return x != null && (typeof x === 'object' || typeof x === 'function');
	}
	function toObject(x) {
		if (x == null)
			throw $TypeError();
		return $Object(x);
	}
	function assertObject(x) {
		if (!isObject(x))
			throw $TypeError(x + ' is not an Object');
		return x;
	}
	function spread() {
		var rv = [],
				k = 0;
		for (var i = 0; i < arguments.length; i++) {
			var valueToSpread = toObject(arguments[i]);
			for (var j = 0; j < valueToSpread.length; j++) {
				rv[k++] = valueToSpread[j];
			}
		}
		return rv;
	}
	function getPropertyDescriptor(object, name) {
		while (object !== null) {
			var result = $getOwnPropertyDescriptor(object, name);
			if (result)
				return result;
			object = $getPrototypeOf(object);
		}
		return undefined;
	}
	function superDescriptor(homeObject, name) {
		var proto = $getPrototypeOf(homeObject);
		if (!proto)
			throw $TypeError('super is null');
		return getPropertyDescriptor(proto, name);
	}
	function superCall(self, homeObject, name, args) {
		var descriptor = superDescriptor(homeObject, name);
		if (descriptor) {
			if ('value' in descriptor)
				return descriptor.value.apply(self, args);
			if (descriptor.get)
				return descriptor.get.call(self).apply(self, args);
		}
		throw $TypeError("super has no method '" + name + "'.");
	}
	function superGet(self, homeObject, name) {
		var descriptor = superDescriptor(homeObject, name);
		if (descriptor) {
			if (descriptor.get)
				return descriptor.get.call(self);
			else if ('value' in descriptor)
				return descriptor.value;
		}
		return undefined;
	}
	function superSet(self, homeObject, name, value) {
		var descriptor = superDescriptor(homeObject, name);
		if (descriptor && descriptor.set) {
			descriptor.set.call(self, value);
			return value;
		}
		throw $TypeError("super has no setter '" + name + "'.");
	}
	function getDescriptors(object) {
		var descriptors = {},
				name,
				names = $getOwnPropertyNames(object);
		for (var i = 0; i < names.length; i++) {
			var name = names[i];
			descriptors[name] = $getOwnPropertyDescriptor(object, name);
		}
		return descriptors;
	}
	function createClass(ctor, object, staticObject, superClass) {
		$defineProperty(object, 'constructor', {
			value: ctor,
			configurable: true,
			enumerable: false,
			writable: true
		});
		if (arguments.length > 3) {
			if (typeof superClass === 'function')
				ctor.__proto__ = superClass;
			ctor.prototype = $create(getProtoParent(superClass), getDescriptors(object));
		} else {
			ctor.prototype = object;
		}
		$defineProperty(ctor, 'prototype', {
			configurable: false,
			writable: false
		});
		return $defineProperties(ctor, getDescriptors(staticObject));
	}
	function getProtoParent(superClass) {
		if (typeof superClass === 'function') {
			var prototype = superClass.prototype;
			if ($Object(prototype) === prototype || prototype === null)
				return superClass.prototype;
		}
		if (superClass === null)
			return null;
		throw new TypeError();
	}
	function defaultSuperCall(self, homeObject, args) {
		if ($getPrototypeOf(homeObject) !== null)
			superCall(self, homeObject, 'constructor', args);
	}
	var ST_NEWBORN = 0;
	var ST_EXECUTING = 1;
	var ST_SUSPENDED = 2;
	var ST_CLOSED = 3;
	var END_STATE = -2;
	var RETHROW_STATE = -3;
	function addIterator(object) {
		return defineProperty(object, Symbol.iterator, nonEnum(function() {
			return this;
		}));
	}
	function getInternalError(state) {
		return new Error('Traceur compiler bug: invalid state in state machine: ' + state);
	}
	function GeneratorContext() {
		this.state = 0;
		this.GState = ST_NEWBORN;
		this.storedException = undefined;
		this.finallyFallThrough = undefined;
		this.sent_ = undefined;
		this.returnValue = undefined;
		this.tryStack_ = [];
	}
	GeneratorContext.prototype = {
		pushTry: function(catchState, finallyState) {
			if (finallyState !== null) {
				var finallyFallThrough = null;
				for (var i = this.tryStack_.length - 1; i >= 0; i--) {
					if (this.tryStack_[i].catch !== undefined) {
						finallyFallThrough = this.tryStack_[i].catch;
						break;
					}
				}
				if (finallyFallThrough === null)
					finallyFallThrough = RETHROW_STATE;
				this.tryStack_.push({
					finally: finallyState,
					finallyFallThrough: finallyFallThrough
				});
			}
			if (catchState !== null) {
				this.tryStack_.push({catch: catchState});
			}
		},
		popTry: function() {
			this.tryStack_.pop();
		},
		get sent() {
			this.maybeThrow();
			return this.sent_;
		},
		set sent(v) {
			this.sent_ = v;
		},
		get sentIgnoreThrow() {
			return this.sent_;
		},
		maybeThrow: function() {
			if (this.action === 'throw') {
				this.action = 'next';
				throw this.sent_;
			}
		},
		end: function() {
			switch (this.state) {
				case END_STATE:
					return this;
				case RETHROW_STATE:
					throw this.storedException;
				default:
					throw getInternalError(this.state);
			}
		},
		handleException: function(ex) {
			this.GState = ST_CLOSED;
			this.state = END_STATE;
			throw ex;
		}
	};
	function getNextOrThrow(ctx, moveNext, action) {
		return function(x) {
			switch (ctx.GState) {
				case ST_EXECUTING:
					throw new Error(("\"" + action + "\" on executing generator"));
				case ST_CLOSED:
					throw new Error(("\"" + action + "\" on closed generator"));
				case ST_NEWBORN:
					if (action === 'throw') {
						ctx.GState = ST_CLOSED;
						throw x;
					}
					if (x !== undefined)
						throw $TypeError('Sent value to newborn generator');
				case ST_SUSPENDED:
					ctx.GState = ST_EXECUTING;
					ctx.action = action;
					ctx.sent = x;
					var value = moveNext(ctx);
					var done = value === ctx;
					if (done)
						value = ctx.returnValue;
					ctx.GState = done ? ST_CLOSED : ST_SUSPENDED;
					return {
						value: value,
						done: done
					};
			}
		};
	}
	function generatorWrap(innerFunction, self) {
		var moveNext = getMoveNext(innerFunction, self);
		var ctx = new GeneratorContext();
		return addIterator({
			next: getNextOrThrow(ctx, moveNext, 'next'),
			throw: getNextOrThrow(ctx, moveNext, 'throw')
		});
	}
	function AsyncFunctionContext() {
		GeneratorContext.call(this);
		this.err = undefined;
		var ctx = this;
		ctx.result = new Promise(function(resolve, reject) {
			ctx.resolve = resolve;
			ctx.reject = reject;
		});
	}
	AsyncFunctionContext.prototype = Object.create(GeneratorContext.prototype);
	AsyncFunctionContext.prototype.end = function() {
		switch (this.state) {
			case END_STATE:
				this.resolve(this.returnValue);
				break;
			case RETHROW_STATE:
				this.reject(this.storedException);
				break;
			default:
				this.reject(getInternalError(this.state));
		}
	};
	AsyncFunctionContext.prototype.handleException = function() {
		this.state = RETHROW_STATE;
	};
	function asyncWrap(innerFunction, self) {
		var moveNext = getMoveNext(innerFunction, self);
		var ctx = new AsyncFunctionContext();
		ctx.createCallback = function(newState) {
			return function(value) {
				ctx.state = newState;
				ctx.value = value;
				moveNext(ctx);
			};
		};
		ctx.errback = function(err) {
			handleCatch(ctx, err);
			moveNext(ctx);
		};
		moveNext(ctx);
		return ctx.result;
	}
	function getMoveNext(innerFunction, self) {
		return function(ctx) {
			while (true) {
				try {
					return innerFunction.call(self, ctx);
				} catch (ex) {
					handleCatch(ctx, ex);
				}
			}
		};
	}
	function handleCatch(ctx, ex) {
		ctx.storedException = ex;
		var last = ctx.tryStack_[ctx.tryStack_.length - 1];
		if (!last) {
			ctx.handleException(ex);
			return;
		}
		ctx.state = last.catch !== undefined ? last.catch : last.finally;
		if (last.finallyFallThrough !== undefined)
			ctx.finallyFallThrough = last.finallyFallThrough;
	}
	function setupGlobals(global) {
		global.Symbol = Symbol;
		polyfillObject(global.Object);
	}
	setupGlobals(global);
	global.$traceurRuntime = {
		assertObject: assertObject,
		asyncWrap: asyncWrap,
		createClass: createClass,
		defaultSuperCall: defaultSuperCall,
		exportStar: exportStar,
		generatorWrap: generatorWrap,
		setProperty: setProperty,
		setupGlobals: setupGlobals,
		spread: spread,
		superCall: superCall,
		superGet: superGet,
		superSet: superSet,
		toObject: toObject,
		toProperty: toProperty,
		type: types,
		typeof: typeOf,
		getOwnHashObject: getOwnHashObject
	};
})(typeof global !== 'undefined' ? global : this);
(function() {
	function buildFromEncodedParts(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
		var out = [];
		if (opt_scheme) {
			out.push(opt_scheme, ':');
		}
		if (opt_domain) {
			out.push('//');
			if (opt_userInfo) {
				out.push(opt_userInfo, '@');
			}
			out.push(opt_domain);
			if (opt_port) {
				out.push(':', opt_port);
			}
		}
		if (opt_path) {
			out.push(opt_path);
		}
		if (opt_queryData) {
			out.push('?', opt_queryData);
		}
		if (opt_fragment) {
			out.push('#', opt_fragment);
		}
		return out.join('');
	}
	;
	var splitRe = new RegExp('^' + '(?:' + '([^:/?#.]+)' + ':)?' + '(?://' + '(?:([^/?#]*)@)?' + '([\\w\\d\\-\\u0100-\\uffff.%]*)' + '(?::([0-9]+))?' + ')?' + '([^?#]+)?' + '(?:\\?([^#]*))?' + '(?:#(.*))?' + '$');
	var ComponentIndex = {
		SCHEME: 1,
		USER_INFO: 2,
		DOMAIN: 3,
		PORT: 4,
		PATH: 5,
		QUERY_DATA: 6,
		FRAGMENT: 7
	};
	function split(uri) {
		return (uri.match(splitRe));
	}
	function removeDotSegments(path) {
		if (path === '/')
			return '/';
		var leadingSlash = path[0] === '/' ? '/' : '';
		var trailingSlash = path.slice(-1) === '/' ? '/' : '';
		var segments = path.split('/');
		var out = [];
		var up = 0;
		for (var pos = 0; pos < segments.length; pos++) {
			var segment = segments[pos];
			switch (segment) {
				case '':
				case '.':
					break;
				case '..':
					if (out.length)
						out.pop();
					else
						up++;
					break;
				default:
					out.push(segment);
			}
		}
		if (!leadingSlash) {
			while (up-- > 0) {
				out.unshift('..');
			}
			if (out.length === 0)
				out.push('.');
		}
		return leadingSlash + out.join('/') + trailingSlash;
	}
	function joinAndCanonicalizePath(parts) {
		var path = parts[ComponentIndex.PATH] || '';
		path = removeDotSegments(path);
		parts[ComponentIndex.PATH] = path;
		return buildFromEncodedParts(parts[ComponentIndex.SCHEME], parts[ComponentIndex.USER_INFO], parts[ComponentIndex.DOMAIN], parts[ComponentIndex.PORT], parts[ComponentIndex.PATH], parts[ComponentIndex.QUERY_DATA], parts[ComponentIndex.FRAGMENT]);
	}
	function canonicalizeUrl(url) {
		var parts = split(url);
		return joinAndCanonicalizePath(parts);
	}
	function resolveUrl(base, url) {
		var parts = split(url);
		var baseParts = split(base);
		if (parts[ComponentIndex.SCHEME]) {
			return joinAndCanonicalizePath(parts);
		} else {
			parts[ComponentIndex.SCHEME] = baseParts[ComponentIndex.SCHEME];
		}
		for (var i = ComponentIndex.SCHEME; i <= ComponentIndex.PORT; i++) {
			if (!parts[i]) {
				parts[i] = baseParts[i];
			}
		}
		if (parts[ComponentIndex.PATH][0] == '/') {
			return joinAndCanonicalizePath(parts);
		}
		var path = baseParts[ComponentIndex.PATH];
		var index = path.lastIndexOf('/');
		path = path.slice(0, index + 1) + parts[ComponentIndex.PATH];
		parts[ComponentIndex.PATH] = path;
		return joinAndCanonicalizePath(parts);
	}
	function isAbsolute(name) {
		if (!name)
			return false;
		if (name[0] === '/')
			return true;
		var parts = split(name);
		if (parts[ComponentIndex.SCHEME])
			return true;
		return false;
	}
	$traceurRuntime.canonicalizeUrl = canonicalizeUrl;
	$traceurRuntime.isAbsolute = isAbsolute;
	$traceurRuntime.removeDotSegments = removeDotSegments;
	$traceurRuntime.resolveUrl = resolveUrl;
})();
(function(global) {
var $__2 = $traceurRuntime.assertObject($traceurRuntime),
			canonicalizeUrl = $__2.canonicalizeUrl,
			resolveUrl = $__2.resolveUrl,
			isAbsolute = $__2.isAbsolute;
	var moduleInstantiators = Object.create(null);
	var baseURL;
	if (global.location && global.location.href)
		baseURL = resolveUrl(global.location.href, './');
	else
		baseURL = '';
	var UncoatedModuleEntry = function UncoatedModuleEntry(url, uncoatedModule) {
		this.url = url;
		this.value_ = uncoatedModule;
	};
	($traceurRuntime.createClass)(UncoatedModuleEntry, {}, {});
	var UncoatedModuleInstantiator = function UncoatedModuleInstantiator(url, func) {
		$traceurRuntime.superCall(this, $UncoatedModuleInstantiator.prototype, "constructor", [url, null]);
		this.func = func;
	};
	var $UncoatedModuleInstantiator = UncoatedModuleInstantiator;
	($traceurRuntime.createClass)(UncoatedModuleInstantiator, {getUncoatedModule: function() {
			if (this.value_)
				return this.value_;
			return this.value_ = this.func.call(global);
		}}, {}, UncoatedModuleEntry);
	function getUncoatedModuleInstantiator(name) {
		if (!name)
			return;
		var url = ModuleStore.normalize(name);
		return moduleInstantiators[url];
	}
	;
	var moduleInstances = Object.create(null);
	var liveModuleSentinel = {};
	function Module(uncoatedModule) {
		var isLive = arguments[1];
		var coatedModule = Object.create(null);
		Object.getOwnPropertyNames(uncoatedModule).forEach((function(name) {
			var getter,
					value;
			if (isLive === liveModuleSentinel) {
				var descr = Object.getOwnPropertyDescriptor(uncoatedModule, name);
				if (descr.get)
					getter = descr.get;
			}
			if (!getter) {
				value = uncoatedModule[name];
				getter = function() {
					return value;
				};
			}
			Object.defineProperty(coatedModule, name, {
				get: getter,
				enumerable: true
			});
		}));
		Object.preventExtensions(coatedModule);
		return coatedModule;
	}
	var ModuleStore = {
		normalize: function(name, refererName, refererAddress) {
			if (typeof name !== "string")
				throw new TypeError("module name must be a string, not " + typeof name);
			if (isAbsolute(name))
				return canonicalizeUrl(name);
			if (/[^\.]\/\.\.\//.test(name)) {
				throw new Error('module name embeds /../: ' + name);
			}
			if (name[0] === '.' && refererName)
				return resolveUrl(refererName, name);
			return canonicalizeUrl(name);
		},
		get: function(normalizedName) {
			var m = getUncoatedModuleInstantiator(normalizedName);
			if (!m)
				return undefined;
			var moduleInstance = moduleInstances[m.url];
			if (moduleInstance)
				return moduleInstance;
			moduleInstance = Module(m.getUncoatedModule(), liveModuleSentinel);
			return moduleInstances[m.url] = moduleInstance;
		},
		set: function(normalizedName, module) {
			normalizedName = String(normalizedName);
			moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, (function() {
				return module;
			}));
			moduleInstances[normalizedName] = module;
		},
		get baseURL() {
			return baseURL;
		},
		set baseURL(v) {
			baseURL = String(v);
		},
		registerModule: function(name, func) {
			var normalizedName = ModuleStore.normalize(name);
			if (moduleInstantiators[normalizedName])
				throw new Error('duplicate module named ' + normalizedName);
			moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, func);
		},
		bundleStore: Object.create(null),
		register: function(name, deps, func) {
			if (!deps || !deps.length) {
				this.registerModule(name, func);
			} else {
				this.bundleStore[name] = {
					deps: deps,
					execute: func
				};
			}
		},
		getAnonymousModule: function(func) {
			return new Module(func.call(global), liveModuleSentinel);
		},
		getForTesting: function(name) {
			var $__0 = this;
			if (!this.testingPrefix_) {
				Object.keys(moduleInstances).some((function(key) {
					var m = /(traceur@[^\/]*\/)/.exec(key);
					if (m) {
						$__0.testingPrefix_ = m[1];
						return true;
					}
				}));
			}
			return this.get(this.testingPrefix_ + name);
		}
	};
	ModuleStore.set('@traceur/src/runtime/ModuleStore', new Module({ModuleStore: ModuleStore}));
	var setupGlobals = $traceurRuntime.setupGlobals;
	$traceurRuntime.setupGlobals = function(global) {
		setupGlobals(global);
	};
	$traceurRuntime.ModuleStore = ModuleStore;
	global.System = {
		register: ModuleStore.register.bind(ModuleStore),
		get: ModuleStore.get,
		set: ModuleStore.set,
		normalize: ModuleStore.normalize
	};
	$traceurRuntime.getModuleImpl = function(name) {
		var instantiator = getUncoatedModuleInstantiator(name);
		return instantiator && instantiator.getUncoatedModule();
	};
})(typeof global !== 'undefined' ? global : this);
System.register("traceur-runtime@0.0.33/src/runtime/polyfills/utils", [], function() {
var __moduleName = "traceur-runtime@0.0.33/src/runtime/polyfills/utils";
	var toObject = $traceurRuntime.toObject;
	function toUint32(x) {
		return x | 0;
	}
	function isObject(x) {
		return x && (typeof x === 'object' || typeof x === 'function');
	}
	return {
		get toObject() {
			return toObject;
		},
		get toUint32() {
			return toUint32;
		},
		get isObject() {
			return isObject;
		}
	};
});
System.register("traceur-runtime@0.0.33/src/runtime/polyfills/ArrayIterator", [], function() {
var $__4;
	var __moduleName = "traceur-runtime@0.0.33/src/runtime/polyfills/ArrayIterator";
	var $__5 = $traceurRuntime.assertObject(System.get("traceur-runtime@0.0.33/src/runtime/polyfills/utils")),
			toObject = $__5.toObject,
			toUint32 = $__5.toUint32;
	var ARRAY_ITERATOR_KIND_KEYS = 1;
	var ARRAY_ITERATOR_KIND_VALUES = 2;
	var ARRAY_ITERATOR_KIND_ENTRIES = 3;
	var ArrayIterator = function ArrayIterator() {};
	($traceurRuntime.createClass)(ArrayIterator, ($__4 = {}, Object.defineProperty($__4, "next", {
		value: function() {
			var iterator = toObject(this);
			var array = iterator.iteratorObject_;
			if (!array) {
				throw new TypeError('Object is not an ArrayIterator');
			}
			var index = iterator.arrayIteratorNextIndex_;
			var itemKind = iterator.arrayIterationKind_;
			var length = toUint32(array.length);
			if (index >= length) {
				iterator.arrayIteratorNextIndex_ = Infinity;
				return createIteratorResultObject(undefined, true);
			}
			iterator.arrayIteratorNextIndex_ = index + 1;
			if (itemKind == ARRAY_ITERATOR_KIND_VALUES)
				return createIteratorResultObject(array[index], false);
			if (itemKind == ARRAY_ITERATOR_KIND_ENTRIES)
				return createIteratorResultObject([index, array[index]], false);
			return createIteratorResultObject(index, false);
		},
		configurable: true,
		enumerable: true,
		writable: true
	}), Object.defineProperty($__4, Symbol.iterator, {
		value: function() {
			return this;
		},
		configurable: true,
		enumerable: true,
		writable: true
	}), $__4), {});
	function createArrayIterator(array, kind) {
		var object = toObject(array);
		var iterator = new ArrayIterator;
		iterator.iteratorObject_ = object;
		iterator.arrayIteratorNextIndex_ = 0;
		iterator.arrayIterationKind_ = kind;
		return iterator;
	}
	function createIteratorResultObject(value, done) {
		return {
			value: value,
			done: done
		};
	}
	function entries() {
		return createArrayIterator(this, ARRAY_ITERATOR_KIND_ENTRIES);
	}
	function keys() {
		return createArrayIterator(this, ARRAY_ITERATOR_KIND_KEYS);
	}
	function values() {
		return createArrayIterator(this, ARRAY_ITERATOR_KIND_VALUES);
	}
	return {
		get entries() {
			return entries;
		},
		get keys() {
			return keys;
		},
		get values() {
			return values;
		}
	};
});
System.register("traceur-runtime@0.0.33/src/runtime/polyfills/Map", [], function() {
var __moduleName = "traceur-runtime@0.0.33/src/runtime/polyfills/Map";
	var isObject = $traceurRuntime.assertObject(System.get("traceur-runtime@0.0.33/src/runtime/polyfills/utils")).isObject;
	var getOwnHashObject = $traceurRuntime.getOwnHashObject;
	var $hasOwnProperty = Object.prototype.hasOwnProperty;
	var deletedSentinel = {};
	function lookupIndex(map, key) {
		if (isObject(key)) {
			var hashObject = getOwnHashObject(key);
			return hashObject && map.objectIndex_[hashObject.hash];
		}
		if (typeof key === 'string')
			return map.stringIndex_[key];
		return map.primitiveIndex_[key];
	}
	function initMap(map) {
		map.entries_ = [];
		map.objectIndex_ = Object.create(null);
		map.stringIndex_ = Object.create(null);
		map.primitiveIndex_ = Object.create(null);
		map.deletedCount_ = 0;
	}
	var Map = function Map() {
		var iterable = arguments[0];
		if (!isObject(this))
			throw new TypeError("Constructor Map requires 'new'");
		if ($hasOwnProperty.call(this, 'entries_')) {
			throw new TypeError("Map can not be reentrantly initialised");
		}
		initMap(this);
		if (iterable !== null && iterable !== undefined) {
			var iter = iterable[Symbol.iterator];
			if (iter !== undefined) {
				for (var $__7 = iterable[Symbol.iterator](),
						$__8; !($__8 = $__7.next()).done; ) {
					var $__9 = $traceurRuntime.assertObject($__8.value),
							key = $__9[0],
							value = $__9[1];
					{
						this.set(key, value);
					}
				}
			}
		}
	};
	($traceurRuntime.createClass)(Map, {
		get size() {
			return this.entries_.length / 2 - this.deletedCount_;
		},
		get: function(key) {
			var index = lookupIndex(this, key);
			if (index !== undefined)
				return this.entries_[index + 1];
		},
		set: function(key, value) {
			var objectMode = isObject(key);
			var stringMode = typeof key === 'string';
			var index = lookupIndex(this, key);
			if (index !== undefined) {
				this.entries_[index + 1] = value;
			} else {
				index = this.entries_.length;
				this.entries_[index] = key;
				this.entries_[index + 1] = value;
				if (objectMode) {
					var hashObject = getOwnHashObject(key);
					var hash = hashObject.hash;
					this.objectIndex_[hash] = index;
				} else if (stringMode) {
					this.stringIndex_[key] = index;
				} else {
					this.primitiveIndex_[key] = index;
				}
			}
			return this;
		},
		has: function(key) {
			return lookupIndex(this, key) !== undefined;
		},
		delete: function(key) {
			var objectMode = isObject(key);
			var stringMode = typeof key === 'string';
			var index;
			var hash;
			if (objectMode) {
				var hashObject = getOwnHashObject(key);
				if (hashObject) {
					index = this.objectIndex_[hash = hashObject.hash];
					delete this.objectIndex_[hash];
				}
			} else if (stringMode) {
				index = this.stringIndex_[key];
				delete this.stringIndex_[key];
			} else {
				index = this.primitiveIndex_[key];
				delete this.primitiveIndex_[key];
			}
			if (index !== undefined) {
				this.entries_[index] = deletedSentinel;
				this.entries_[index + 1] = undefined;
				this.deletedCount_++;
			}
		},
		clear: function() {
			initMap(this);
		},
		forEach: function(callbackFn) {
			var thisArg = arguments[1];
			for (var i = 0,
					len = this.entries_.length; i < len; i += 2) {
				var key = this.entries_[i];
				var value = this.entries_[i + 1];
				if (key === deletedSentinel)
					continue;
				callbackFn.call(thisArg, value, key, this);
			}
		}
	}, {});
	return {get Map() {
			return Map;
		}};
});
System.register("traceur-runtime@0.0.33/node_modules/rsvp/lib/rsvp/asap", [], function() {
var __moduleName = "traceur-runtime@0.0.33/node_modules/rsvp/lib/rsvp/asap";
	var $__default = function asap(callback, arg) {
		var length = queue.push([callback, arg]);
		if (length === 1) {
			scheduleFlush();
		}
	};
	var browserGlobal = (typeof window !== 'undefined') ? window : {};
	var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
	function useNextTick() {
		return function() {
			process.nextTick(flush);
		};
	}
	function useMutationObserver() {
		var iterations = 0;
		var observer = new BrowserMutationObserver(flush);
		var node = document.createTextNode('');
		observer.observe(node, {characterData: true});
		return function() {
			node.data = (iterations = ++iterations % 2);
		};
	}
	function useSetTimeout() {
		return function() {
			setTimeout(flush, 1);
		};
	}
	var queue = [];
	function flush() {
		for (var i = 0; i < queue.length; i++) {
			var tuple = queue[i];
			var callback = tuple[0],
					arg = tuple[1];
			callback(arg);
		}
		queue = [];
	}
	var scheduleFlush;
	if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
		scheduleFlush = useNextTick();
	} else if (BrowserMutationObserver) {
		scheduleFlush = useMutationObserver();
	} else {
		scheduleFlush = useSetTimeout();
	}
	return {get default() {
			return $__default;
		}};
});
System.register("traceur-runtime@0.0.33/src/runtime/polyfills/Promise", [], function() {
var __moduleName = "traceur-runtime@0.0.33/src/runtime/polyfills/Promise";
	var async = $traceurRuntime.assertObject(System.get("traceur-runtime@0.0.33/node_modules/rsvp/lib/rsvp/asap")).default;
	var promiseRaw = {};
	function isPromise(x) {
		return x && typeof x === 'object' && x.status_ !== undefined;
	}
	function idResolveHandler(x) {
		return x;
	}
	function idRejectHandler(x) {
		throw x;
	}
	function chain(promise) {
		var onResolve = arguments[1] !== (void 0) ? arguments[1] : idResolveHandler;
		var onReject = arguments[2] !== (void 0) ? arguments[2] : idRejectHandler;
		var deferred = getDeferred(promise.constructor);
		switch (promise.status_) {
			case undefined:
				throw TypeError;
			case 0:
				promise.onResolve_.push(onResolve, deferred);
				promise.onReject_.push(onReject, deferred);
				break;
			case +1:
				promiseEnqueue(promise.value_, [onResolve, deferred]);
				break;
			case -1:
				promiseEnqueue(promise.value_, [onReject, deferred]);
				break;
		}
		return deferred.promise;
	}
	function getDeferred(C) {
		if (this === $Promise) {
			var promise = promiseInit(new $Promise(promiseRaw));
			return {
				promise: promise,
				resolve: (function(x) {
					promiseResolve(promise, x);
				}),
				reject: (function(r) {
					promiseReject(promise, r);
				})
			};
		} else {
			var result = {};
			result.promise = new C((function(resolve, reject) {
				result.resolve = resolve;
				result.reject = reject;
			}));
			return result;
		}
	}
	function promiseSet(promise, status, value, onResolve, onReject) {
		promise.status_ = status;
		promise.value_ = value;
		promise.onResolve_ = onResolve;
		promise.onReject_ = onReject;
		return promise;
	}
	function promiseInit(promise) {
		return promiseSet(promise, 0, undefined, [], []);
	}
	var Promise = function Promise(resolver) {
		if (resolver === promiseRaw)
			return;
		if (typeof resolver !== 'function')
			throw new TypeError;
		var promise = promiseInit(this);
		try {
			resolver((function(x) {
				promiseResolve(promise, x);
			}), (function(r) {
				promiseReject(promise, r);
			}));
		} catch (e) {
			promiseReject(promise, e);
		}
	};
	($traceurRuntime.createClass)(Promise, {
		catch: function(onReject) {
			return this.then(undefined, onReject);
		},
		then: function(onResolve, onReject) {
			if (typeof onResolve !== 'function')
				onResolve = idResolveHandler;
			if (typeof onReject !== 'function')
				onReject = idRejectHandler;
			var that = this;
			var constructor = this.constructor;
			return chain(this, function(x) {
				x = promiseCoerce(constructor, x);
				return x === that ? onReject(new TypeError) : isPromise(x) ? x.then(onResolve, onReject) : onResolve(x);
			}, onReject);
		}
	}, {
		resolve: function(x) {
			if (this === $Promise) {
				return promiseSet(new $Promise(promiseRaw), +1, x);
			} else {
				return new this(function(resolve, reject) {
					resolve(x);
				});
			}
		},
		reject: function(r) {
			if (this === $Promise) {
				return promiseSet(new $Promise(promiseRaw), -1, r);
			} else {
				return new this((function(resolve, reject) {
					reject(r);
				}));
			}
		},
		cast: function(x) {
			if (x instanceof this)
				return x;
			if (isPromise(x)) {
				var result = getDeferred(this);
				chain(x, result.resolve, result.reject);
				return result.promise;
			}
			return this.resolve(x);
		},
		all: function(values) {
			var deferred = getDeferred(this);
			var resolutions = [];
			try {
				var count = values.length;
				if (count === 0) {
					deferred.resolve(resolutions);
				} else {
					for (var i = 0; i < values.length; i++) {
						this.resolve(values[i]).then(function(i, x) {
							resolutions[i] = x;
							if (--count === 0)
								deferred.resolve(resolutions);
						}.bind(undefined, i), (function(r) {
							deferred.reject(r);
						}));
					}
				}
			} catch (e) {
				deferred.reject(e);
			}
			return deferred.promise;
		},
		race: function(values) {
			var deferred = getDeferred(this);
			try {
				for (var i = 0; i < values.length; i++) {
					this.resolve(values[i]).then((function(x) {
						deferred.resolve(x);
					}), (function(r) {
						deferred.reject(r);
					}));
				}
			} catch (e) {
				deferred.reject(e);
			}
			return deferred.promise;
		}
	});
	var $Promise = Promise;
	var $PromiseReject = $Promise.reject;
	function promiseResolve(promise, x) {
		promiseDone(promise, +1, x, promise.onResolve_);
	}
	function promiseReject(promise, r) {
		promiseDone(promise, -1, r, promise.onReject_);
	}
	function promiseDone(promise, status, value, reactions) {
		if (promise.status_ !== 0)
			return;
		promiseEnqueue(value, reactions);
		promiseSet(promise, status, value);
	}
	function promiseEnqueue(value, tasks) {
		async((function() {
			for (var i = 0; i < tasks.length; i += 2) {
				promiseHandle(value, tasks[i], tasks[i + 1]);
			}
		}));
	}
	function promiseHandle(value, handler, deferred) {
		try {
			var result = handler(value);
			if (result === deferred.promise)
				throw new TypeError;
			else if (isPromise(result))
				chain(result, deferred.resolve, deferred.reject);
			else
				deferred.resolve(result);
		} catch (e) {
			try {
				deferred.reject(e);
			} catch (e) {}
		}
	}
	var thenableSymbol = '@@thenable';
	function isObject(x) {
		return x && (typeof x === 'object' || typeof x === 'function');
	}
	function promiseCoerce(constructor, x) {
		if (!isPromise(x) && isObject(x)) {
			var then;
			try {
				then = x.then;
			} catch (r) {
				var promise = $PromiseReject.call(constructor, r);
				x[thenableSymbol] = promise;
				return promise;
			}
			if (typeof then === 'function') {
				var p = x[thenableSymbol];
				if (p) {
					return p;
				} else {
					var deferred = getDeferred(constructor);
					x[thenableSymbol] = deferred.promise;
					try {
						then.call(x, deferred.resolve, deferred.reject);
					} catch (r) {
						deferred.reject(r);
					}
					return deferred.promise;
				}
			}
		}
		return x;
	}
	return {get Promise() {
			return Promise;
		}};
});
System.register("traceur-runtime@0.0.33/src/runtime/polyfills/String", [], function() {
var __moduleName = "traceur-runtime@0.0.33/src/runtime/polyfills/String";
	var $toString = Object.prototype.toString;
	var $indexOf = String.prototype.indexOf;
	var $lastIndexOf = String.prototype.lastIndexOf;
	function startsWith(search) {
		var string = String(this);
		if (this == null || $toString.call(search) == '[object RegExp]') {
			throw TypeError();
		}
		var stringLength = string.length;
		var searchString = String(search);
		var searchLength = searchString.length;
		var position = arguments.length > 1 ? arguments[1] : undefined;
		var pos = position ? Number(position) : 0;
		if (isNaN(pos)) {
			pos = 0;
		}
		var start = Math.min(Math.max(pos, 0), stringLength);
		return $indexOf.call(string, searchString, pos) == start;
	}
	function endsWith(search) {
		var string = String(this);
		if (this == null || $toString.call(search) == '[object RegExp]') {
			throw TypeError();
		}
		var stringLength = string.length;
		var searchString = String(search);
		var searchLength = searchString.length;
		var pos = stringLength;
		if (arguments.length > 1) {
			var position = arguments[1];
			if (position !== undefined) {
				pos = position ? Number(position) : 0;
				if (isNaN(pos)) {
					pos = 0;
				}
			}
		}
		var end = Math.min(Math.max(pos, 0), stringLength);
		var start = end - searchLength;
		if (start < 0) {
			return false;
		}
		return $lastIndexOf.call(string, searchString, start) == start;
	}
	function contains(search) {
		if (this == null) {
			throw TypeError();
		}
		var string = String(this);
		var stringLength = string.length;
		var searchString = String(search);
		var searchLength = searchString.length;
		var position = arguments.length > 1 ? arguments[1] : undefined;
		var pos = position ? Number(position) : 0;
		if (isNaN(pos)) {
			pos = 0;
		}
		var start = Math.min(Math.max(pos, 0), stringLength);
		return $indexOf.call(string, searchString, pos) != -1;
	}
	function repeat(count) {
		if (this == null) {
			throw TypeError();
		}
		var string = String(this);
		var n = count ? Number(count) : 0;
		if (isNaN(n)) {
			n = 0;
		}
		if (n < 0 || n == Infinity) {
			throw RangeError();
		}
		if (n == 0) {
			return '';
		}
		var result = '';
		while (n--) {
			result += string;
		}
		return result;
	}
	function codePointAt(position) {
		if (this == null) {
			throw TypeError();
		}
		var string = String(this);
		var size = string.length;
		var index = position ? Number(position) : 0;
		if (isNaN(index)) {
			index = 0;
		}
		if (index < 0 || index >= size) {
			return undefined;
		}
		var first = string.charCodeAt(index);
		var second;
		if (first >= 0xD800 && first <= 0xDBFF && size > index + 1) {
			second = string.charCodeAt(index + 1);
			if (second >= 0xDC00 && second <= 0xDFFF) {
				return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
			}
		}
		return first;
	}
	function raw(callsite) {
		var raw = callsite.raw;
		var len = raw.length >>> 0;
		if (len === 0)
			return '';
		var s = '';
		var i = 0;
		while (true) {
			s += raw[i];
			if (i + 1 === len)
				return s;
			s += arguments[++i];
		}
	}
	function fromCodePoint() {
		var codeUnits = [];
		var floor = Math.floor;
		var highSurrogate;
		var lowSurrogate;
		var index = -1;
		var length = arguments.length;
		if (!length) {
			return '';
		}
		while (++index < length) {
			var codePoint = Number(arguments[index]);
			if (!isFinite(codePoint) || codePoint < 0 || codePoint > 0x10FFFF || floor(codePoint) != codePoint) {
				throw RangeError('Invalid code point: ' + codePoint);
			}
			if (codePoint <= 0xFFFF) {
				codeUnits.push(codePoint);
			} else {
				codePoint -= 0x10000;
				highSurrogate = (codePoint >> 10) + 0xD800;
				lowSurrogate = (codePoint % 0x400) + 0xDC00;
				codeUnits.push(highSurrogate, lowSurrogate);
			}
		}
		return String.fromCharCode.apply(null, codeUnits);
	}
	return {
		get startsWith() {
			return startsWith;
		},
		get endsWith() {
			return endsWith;
		},
		get contains() {
			return contains;
		},
		get repeat() {
			return repeat;
		},
		get codePointAt() {
			return codePointAt;
		},
		get raw() {
			return raw;
		},
		get fromCodePoint() {
			return fromCodePoint;
		}
	};
});
System.register("traceur-runtime@0.0.33/src/runtime/polyfills/polyfills", [], function() {
var __moduleName = "traceur-runtime@0.0.33/src/runtime/polyfills/polyfills";
	var Map = $traceurRuntime.assertObject(System.get("traceur-runtime@0.0.33/src/runtime/polyfills/Map")).Map;
	var Promise = $traceurRuntime.assertObject(System.get("traceur-runtime@0.0.33/src/runtime/polyfills/Promise")).Promise;
	var $__12 = $traceurRuntime.assertObject(System.get("traceur-runtime@0.0.33/src/runtime/polyfills/String")),
			codePointAt = $__12.codePointAt,
			contains = $__12.contains,
			endsWith = $__12.endsWith,
			fromCodePoint = $__12.fromCodePoint,
			repeat = $__12.repeat,
			raw = $__12.raw,
			startsWith = $__12.startsWith;
	var $__12 = $traceurRuntime.assertObject(System.get("traceur-runtime@0.0.33/src/runtime/polyfills/ArrayIterator")),
			entries = $__12.entries,
			keys = $__12.keys,
			values = $__12.values;
	function maybeDefineMethod(object, name, value) {
		if (!(name in object)) {
			Object.defineProperty(object, name, {
				value: value,
				configurable: true,
				enumerable: false,
				writable: true
			});
		}
	}
	function maybeAddFunctions(object, functions) {
		for (var i = 0; i < functions.length; i += 2) {
			var name = functions[i];
			var value = functions[i + 1];
			maybeDefineMethod(object, name, value);
		}
	}
	function polyfillPromise(global) {
		if (!global.Promise)
			global.Promise = Promise;
	}
	function polyfillCollections(global) {
		if (!global.Map)
			global.Map = Map;
	}
	function polyfillString(String) {
		maybeAddFunctions(String.prototype, ['codePointAt', codePointAt, 'contains', contains, 'endsWith', endsWith, 'startsWith', startsWith, 'repeat', repeat]);
		maybeAddFunctions(String, ['fromCodePoint', fromCodePoint, 'raw', raw]);
	}
	function polyfillArray(Array, Symbol) {
		maybeAddFunctions(Array.prototype, ['entries', entries, 'keys', keys, 'values', values]);
		if (Symbol && Symbol.iterator) {
			Object.defineProperty(Array.prototype, Symbol.iterator, {
				value: values,
				configurable: true,
				enumerable: false,
				writable: true
			});
		}
	}
	function polyfill(global) {
		polyfillPromise(global);
		polyfillCollections(global);
		polyfillString(global.String);
		polyfillArray(global.Array, global.Symbol);
	}
	polyfill(this);
	var setupGlobals = $traceurRuntime.setupGlobals;
	$traceurRuntime.setupGlobals = function(global) {
		setupGlobals(global);
		polyfill(global);
	};
	return {};
});
System.register("traceur-runtime@0.0.33/src/runtime/polyfill-import", [], function() {
var __moduleName = "traceur-runtime@0.0.33/src/runtime/polyfill-import";
	var $__14 = $traceurRuntime.assertObject(System.get("traceur-runtime@0.0.33/src/runtime/polyfills/polyfills"));
	return {};
});
System.get("traceur-runtime@0.0.33/src/runtime/polyfill-import" + '');



// Source: build/compiler-es5.js
var __moduleName = "build/compiler-es5";
function each(object, func, thisp) {
  return Object.keys(object).map((function(key) {
    return func.call(thisp, key, object[key]);
  }));
}
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
var generateKey = (function() {
  var keys = {};
  return function() {
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
var Compiler = function Compiler() {};
var $Compiler = Compiler;
($traceurRuntime.createClass)(Compiler, {
  newline: function(line, runner, status, output) {
    status.last = line.length - 1;
    status.adds = line[0] === "+";
    status.cont = status.cont || (status.ishtml() && status.adds);
  },
  endline: function(line, runner, status, output) {
    if (status.ishtml()) {
      if (!status.cont) {
        output.body += "';\n";
        status.gojs();
      }
    } else {
      output.body += "\n";
    }
    status.cont = false;
  },
  nextchar: function(c, runner, status, output) {
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
  },
  _compile: function(script) {
    var runner = new Runner();
    var status = new Status();
    var output = new Output("'use strict';\n");
    runner.run(this, script, status, output);
    output.body += (status.ishtml() ? "';" : "") + "\nreturn out.write ();";
    return output.body;
  },
  _compilejs: function(c, runner, status, output) {
    switch (c) {
      case "<":
        if (runner.firstchar) {
          status.gohtml();
          status.spot = output.body.length - 1;
          output.body += "out.html += '";
        }
        break;
      case "@":
        this._scriptatt(runner, status, output);
        break;
    }
  },
  _compilehtml: function(c, runner, status, output) {
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
            output.body += ") + '";
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
      case "$":
        if (!special && runner.ahead("{")) {
          status.peek = true;
          status.skip = 2;
          status.curl = 0;
          output.body += "' + (";
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
      case "!":
        if (!special && runner.ahead("{")) {
          console.error('Deprecated syntax !{} is deprecated');
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
      case "+":
        if (runner.firstchar) {
          status.skip = status.adds ? 1 : 0;
        } else if (runner.lastchar) {
          status.cont = true;
          status.skip = 1;
        }
        break;
      case "'":
        if (!special) {
          output.body += "\\";
        }
        break;
      case "@":
        this._htmlatt(runner, status, output);
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
  _scriptatt: function(runner, status, output) {
    var attr = $Compiler._ATTREXP;
    var rest,
        name;
    if (runner.behind("@")) {} else if (runner.ahead("@")) {
      output.body += "var att = new Att ();";
      status.skip = 2;
    } else {
      rest = runner.lineahead();
      name = attr.exec(rest)[0];
      if (name) {
        output.body += rest.replace(name, "att['" + name + "']");
        status.skip = rest.length + 1;
      } else {
        throw "Bad @name: " + rest;
      }
    }
  },
  _htmlatt: function(runner, status, output) {
    var attr = $Compiler._ATTREXP;
    var rest,
        name,
        dels,
        what;
    if (runner.behind("@")) {} else if (runner.behind("#{")) {
      console.error("todo");
    } else if (runner.ahead("@")) {
      output.body += "' + att._all () + '";
      status.skip = 2;
    } else {
      rest = runner.lineahead();
      name = attr.exec(rest)[0];
      dels = runner.behind("-");
      what = dels ? "att._pop" : "att._out";
      output.body = dels ? output.body.substring(0, output.body.length - 1) : output.body;
      output.body += "' + " + what + " ( '" + name + "' ) + '";
      status.skip = name.length + 1;
    }
  },
  _poke: function(status, output) {
    this._inject(status, output, $Compiler._POKE);
  },
  _geek: function(status, output) {
    this._inject(status, output, $Compiler._GEEK);
  },
  _inject: function(status, output, js) {
    var body = output.body,
        temp = output.temp,
        spot = status.spot,
        prev = body.substring(0, spot),
        next = body.substring(spot),
        name = generateKey();
    var outl = js.outline.replace("$name", name).replace("$temp", temp);
    output.body = prev + "\n" + outl + next + js.inline.replace("$name", name);
    status.spot += outl.length + 1;
  }
}, {});
Compiler._POKE = {
  outline: "var $name = edb.$set ( function ( value, checked ) {\n$temp;\n}, this );",
  inline: "edb.$run(event,&quot;\' + $name + \'&quot;);"
};
Compiler._GEEK = {
  outline: "var $name = edb.$set ( function () {\nreturn $temp;\n}, this );",
  inline: "edb.$get(&quot;\' + $name + \'&quot;);"
};
Compiler._ATTREXP = /^[^\d][a-zA-Z0-9-_\.]+/;
var FunctionCompiler = function FunctionCompiler() {
  this._sequence = [this._uncomment, this._validate, this._extract, this._direct, this._define, this._compile];
  this._directives = null;
  this._instructions = null;
  this._params = null;
  this._failed = false;
};
var $FunctionCompiler = FunctionCompiler;
($traceurRuntime.createClass)(FunctionCompiler, {
  compile: function(source, directives) {
    var $__0 = this;
    this._directives = directives || {};
    this._params = [];
    var head = {
      declarations: {},
      functiondefs: []
    };
    source = this._sequence.reduce((function(s, step) {
      return step.call($__0, s, head);
    }), source);
    return new Result(source, this._params, this._instructions);
  },
  _uncomment: function(script) {
    script = this._fisse(script, '<!--', '-->');
    script = this._fisse(script, '/*', '*/');
    return script;
  },
  _fisse: function(script, s1, s2) {
    var a1 = s1.split('');
    var a2 = s2.split('');
    var c1 = a1.shift();
    var c2 = a2.shift();
    s1 = a1.join('');
    s2 = a2.join('');
    var chars = null,
        pass = false,
        next = false,
        fits = (function(i, l, s) {
          return chars.slice(i, l).join('') === s;
        }),
        ahead = (function(i, s) {
          var l = s.length;
          return fits(i, i + l, s);
        }),
        prevs = (function(i, s) {
          var l = s.length;
          return fits(i - l, i, s);
        }),
        start = (function(c, i) {
          return c === c1 && ahead(i + 1, s1);
        }),
        stops = (function(c, i) {
          return c === c2 && prevs(i, s2);
        });
    if (script.contains('<!--')) {
      chars = script.split('');
      return chars.map((function(chaa, i) {
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
      })).join('');
    }
    return script;
  },
  _validate: function(script) {
    if ($FunctionCompiler._NESTEXP.test(script)) {
      throw "Nested EDBML dysfunction";
    }
    return script;
  },
  _direct: function(script) {
    return script;
  },
  _extract: function(script, head) {
    var $__0 = this;
    Instruction.from(script).forEach((function(pi) {
      $__0._instructions = $__0._instructions || [];
      $__0._instructions.push(pi);
      $__0._instruct(pi);
    }));
    return Instruction.clean(script);
  },
  _instruct: function(pi) {
    var type = pi.tag;
    var atts = pi.attributes;
    var name = atts.name;
    switch (type) {
      case "param":
        this._params.push(name);
        break;
    }
  },
  _define: function(script, head) {
    var vars = "",
        html = "var ";
    each(head.declarations, (function(name) {
      vars += ", " + name;
    }));
    if (this._params.indexOf("out") < 0) {
      html += "out = $function.$out, ";
    }
    html += "att = new edb.Att () ";
    html += vars + ";\n";
    head.functiondefs.forEach((function(def) {
      html += def + "\n";
    }));
    return html + script;
  },
  _source: function(source, params) {
    var lines = source.split("\n");
    lines.pop();
    var args = params.length ? "( " + params.join(", ") + " )" : "()";
    return "function " + args + " {\n" + lines.join("\n") + "\n}";
  }
}, {}, Compiler);
FunctionCompiler._NESTEXP = /<script.*type=["']?text\/edbml["']?.*>([\s\S]+?)/g;
var ScriptCompiler = function ScriptCompiler() {
  $traceurRuntime.superCall(this, $ScriptCompiler.prototype, "constructor", []);
  this.inputs = Object.create(null);
  this._sequence.splice(4, 0, this._declare);
};
var $ScriptCompiler = ScriptCompiler;
($traceurRuntime.createClass)(ScriptCompiler, {
  _instruct: function(pi) {
    $traceurRuntime.superCall(this, $ScriptCompiler.prototype, "_instruct", [pi]);
    var atts = pi.attributes;
    switch (pi.tag) {
      case "input":
        this.inputs[atts.name] = atts.type;
        break;
    }
  },
  _declare: function(script, head) {
    var defs = [];
    each(this.inputs, function(name, type) {
      head.declarations[name] = true;
      defs.push(name + " = get ( " + type + " );\n");
    }, this);
    if (defs[0]) {
      head.functiondefs.push("( function inputs ( get ) {\n" + defs.join("") + "}( this.script.inputs ));");
    }
    return script;
  }
}, {}, FunctionCompiler);
var Instruction = function Instruction(pi) {
  this.tag = pi.split("<?")[1].split(" ")[0];
  this.attributes = Object.create(null);
  var hit,
      atexp = $Instruction._ATEXP;
  while ((hit = atexp.exec(pi))) {
    var n = hit[1],
        v = hit[2];
    this.attributes[n] = cast(v);
  }
};
var $Instruction = Instruction;
($traceurRuntime.createClass)(Instruction, {}, {});
Instruction.from = function(source) {
  var pis = [],
      hit = null;
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
var Runner = function Runner() {
  this.firstline = false;
  this.lastline = false;
  this.firstchar = false;
  this.lastchar = false;
  this._line = null;
  this._index = -1;
};
($traceurRuntime.createClass)(Runner, {
  run: function(compiler, script, status, output) {
    this._runlines(compiler, script.split("\n"), status, output);
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
    var length = string.length,
        start = index - length;
    return start >= 0 && line.substr(start, length) === string;
  },
  lineahead: function() {
    return this._line.substring(this._index + 1);
  },
  skipahead: function(string) {
    console.error("TODO");
  },
  _runlines: function(compiler, lines, status, output) {
    var $__0 = this;
    var stop = lines.length - 1;
    lines.forEach((function(line, index) {
      $__0.firstline = index === 0;
      $__0.lastline = index === stop;
      $__0._runline(line, index, compiler, status, output);
    }));
  },
  _runline: function(line, index, compiler, status, output) {
    line = this._line = line.trim();
    if (line.length) {
      compiler.newline(line, this, status, output);
      this._runchars(compiler, line.split(""), status, output);
      compiler.endline(line, this, status, output);
    }
  },
  _runchars: function(compiler, chars, status, output) {
    var $__0 = this;
    var stop = chars.length - 1;
    chars.forEach((function(c, i) {
      $__0._index = i;
      $__0.firstchar = i === 0;
      $__0.lastchar = i === stop;
      compiler.nextchar(c, $__0, status, output);
    }));
  }
}, {});
var Result = function Result(body, params, instructions) {
  this.functionstring = this._tofunctionstring(body, params);
  this.instructionset = instructions;
  this.errormessage = null;
};
($traceurRuntime.createClass)(Result, {
  _tofunctionstring: function(body) {
    var params = arguments[1] !== (void 0) ? arguments[1] : [];
    try {
      var js = new Function(params.join(","), body).toString();
      js = js.replace(/^function anonymous/, "function $function");
      js = js.replace(/\&quot;\&apos;/g, "&quot;");
      return js;
    } catch (exception) {
      this.instructionset = null;
      this.errormessage = exception.message;
      return this._tofallbackstring(body, params, exception.message);
    }
  },
  _tofallbackstring: function(body, params, exception) {
    body = this._emergencyformat(body, params);
    body = new Buffer(body).toString("base64");
    body = "gui.BlobLoader.loadScript ( document, atob (  '" + body + "' ));\n";
    body += "return '<p class=\"edberror\">" + exception + "</p>'";
    return this._tofunctionstring(body);
  },
  _emergencyformat: function(body, params) {
    var result = "",
        tabs = "\t",
        init = null,
        last = null,
        fixt = null,
        hack = null;
    body.split("\n").forEach((function(line) {
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
    }));
    return ["function dysfunction (" + params + ") {", result, "}"].join("\n");
  }
}, {});
var Status = function Status() {
  this.mode = $Status.MODE_JS;
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
var $Status = Status;
($traceurRuntime.createClass)(Status, {
  gojs: function() {
    this.mode = $Status.MODE_JS;
  },
  gohtml: function() {
    this.mode = $Status.MODE_HTML;
  },
  gotag: function() {
    this.mode = $Status.MODE_TAG;
  },
  isjs: function() {
    return this.mode === $Status.MODE_JS;
  },
  ishtml: function() {
    return this.mode === $Status.MODE_HTML;
  },
  istag: function() {
    return this.mode === $Status.MODE_TAG;
  }
}, {});
Status.MODE_JS = "js";
Status.MODE_HTML = "html";
Status.MODE_TAG = "tag";
var Output = function Output() {
  var body = arguments[0] !== (void 0) ? arguments[0] : "";
  this.body = body;
  this.temp = null;
};
($traceurRuntime.createClass)(Output, {}, {});
exports.compile = function(edbml, options) {
  if (edbml.contains("<?input")) {
    return new ScriptCompiler().compile(edbml, options);
  } else {
    return new FunctionCompiler().compile(edbml, options);
  }
};

//# sourceMappingURL=compiler-es5.js.map
