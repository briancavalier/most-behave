(function () {
'use strict';

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// Non-mutating array operations

// cons :: a -> [a] -> [a]
// a with x prepended


// append :: a -> [a] -> [a]
// a with x appended


// drop :: Int -> [a] -> [a]
// drop first n elements
function drop (n, a) { // eslint-disable-line complexity
  if (n < 0) {
    throw new TypeError('n must be >= 0')
  }

  var l = a.length;
  if (n === 0 || l === 0) {
    return a
  }

  if (n >= l) {
    return []
  }

  return unsafeDrop(n, a, l - n)
}

// unsafeDrop :: Int -> [a] -> Int -> [a]
// Internal helper for drop
function unsafeDrop (n, a, l) {
  var b = new Array(l);
  for (var i = 0; i < l; ++i) {
    b[i] = a[n + i];
  }
  return b
}

// tail :: [a] -> [a]
// drop head element
function tail (a) {
  return drop(1, a)
}

// map :: (a -> b) -> [a] -> [b]
// transform each element with f
function map$1 (f, a) {
  var l = a.length;
  var b = new Array(l);
  for (var i = 0; i < l; ++i) {
    b[i] = f(a[i]);
  }
  return b
}

// replace :: a -> Int -> [a]
// replace element at index


// remove :: Int -> [a] -> [a]
// remove element at index


// removeAll :: (a -> boolean) -> [a] -> [a]
// remove all elements matching a predicate
function removeAll (f, a) {
  var l = a.length;
  var b = new Array(l);
  var j = 0;
  for (var x = (void 0), i = 0; i < l; ++i) {
    x = a[i];
    if (!f(x)) {
      b[j] = x;
      ++j;
    }
  }

  b.length = j;
  return b
}

// findIndex :: a -> [a] -> Int
// find index of x in a, from the left
function findIndex (x, a) {
  for (var i = 0, l = a.length; i < l; ++i) {
    if (x === a[i]) {
      return i
    }
  }
  return -1
}

// isArrayLike :: * -> boolean
// Return true iff x is array-like

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// id :: a -> a
var id = function (x) { return x; };

// compose :: (b -> c) -> (a -> b) -> (a -> c)
var compose = function (f, g) { return function (x) { return f(g(x)); }; };

// curry2 :: ((a, b) -> c) -> (a -> b -> c)
function curry2 (f) {
  function curried (a, b) {
    switch (arguments.length) {
      case 0: return curried
      case 1: return function (b) { return f(a, b); }
      default: return f(a, b)
    }
  }
  return curried
}

// curry3 :: ((a, b, c) -> d) -> (a -> b -> c -> d)
function curry3 (f) {
  function curried (a, b, c) { // eslint-disable-line complexity
    switch (arguments.length) {
      case 0: return curried
      case 1: return curry2(function (b, c) { return f(a, b, c); })
      case 2: return function (c) { return f(a, b, c); }
      default:return f(a, b, c)
    }
  }
  return curried
}

/** @license MIT License (c) copyright 2016 original author or authors */

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Stream (source) {
  this.source = source;
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */

var Disposable = function Disposable (dispose, data) {
  this._dispose = dispose;
  this._data = data;
};

Disposable.prototype.dispose = function dispose () {
  return this._dispose(this._data)
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */

var SettableDisposable = function SettableDisposable () {
  var this$1 = this;

  this.disposable = void 0;
  this.disposed = false;
  this._resolve = void 0;

  this.result = new Promise(function (resolve) {
    this$1._resolve = resolve;
  });
};

SettableDisposable.prototype.setDisposable = function setDisposable (disposable) {
  if (this.disposable !== void 0) {
    throw new Error('setDisposable called more than once')
  }

  this.disposable = disposable;

  if (this.disposed) {
    this._resolve(disposable.dispose());
  }
};

SettableDisposable.prototype.dispose = function dispose () {
  if (this.disposed) {
    return this.result
  }

  this.disposed = true;

  if (this.disposable !== void 0) {
    this.result = this.disposable.dispose();
  }

  return this.result
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */

function disposeSafely (disposable) {
  try {
    return disposable.dispose()
  } catch (e) {
    return Promise.reject(e)
  }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
var MemoizedDisposable = function MemoizedDisposable (disposable) {
  this.disposed = false;
  this.value = undefined;
  this.disposable = disposable;
};

MemoizedDisposable.prototype.dispose = function dispose () {
  if (!this.disposed) {
    this.disposed = true;
    this.value = disposeSafely(this.disposable);
    this.disposable = undefined;
  }

  return this.value
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function isPromise (p) {
  return p !== null && typeof p === 'object' && typeof p.then === 'function'
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */

/**
 * Call disposable.dispose.  If it returns a promise, catch promise
 * error and forward it through the provided sink.
 * @param {number} t time
 * @param {{dispose: function}} disposable
 * @param {{error: function}} sink
 * @return {*} result of disposable.dispose
 */
function tryDispose (t, disposable, sink) {
  var result = disposeSafely(disposable);
  return isPromise(result)
    ? result.catch(function (e) { return sink.error(t, e); })
    : result
}

/**
 * Create a new Disposable which will dispose its underlying resource
 * at most once.
 * @param {function} dispose function
 * @param {*?} data any data to be passed to disposer function
 * @return {Disposable}
 */
var create = function (dispose, data) { return once(new Disposable(dispose, data)); };

/**
 * Create a noop disposable. Can be used to satisfy a Disposable
 * requirement when no actual resource needs to be disposed.
 * @return {Disposable|exports|module.exports}
 */
var empty$1 = function () { return new Disposable(id, undefined); };

/**
 * Create a disposable that will dispose all input disposables in parallel.
 * @param {Array<Disposable>} disposables
 * @return {Disposable}
 */
var all = function (disposables) { return create(disposeAll, disposables); };

var disposeAll = function (disposables) { return Promise.all(map$1(disposeSafely, disposables)); };

/**
 * Create a disposable from a promise for another disposable
 * @param {Promise<Disposable>} disposablePromise
 * @return {Disposable}
 */


/**
 * Create a disposable proxy that allows its underlying disposable to
 * be set later.
 * @return {SettableDisposable}
 */
var settable = function () { return new SettableDisposable(); };

/**
 * Wrap an existing disposable (which may not already have been once()d)
 * so that it will only dispose its underlying resource at most once.
 * @param {{ dispose: function() }} disposable
 * @return {Disposable} wrapped disposable
 */
var once = function (disposable) { return new MemoizedDisposable(disposable); };

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function fatalError (e) {
  setTimeout(function () {
    throw e
  }, 0);
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function PropagateTask (run, value, sink) {
  this._run = run;
  this.value = value;
  this.sink = sink;
  this.active = true;
}

PropagateTask.event = function (value, sink) {
  return new PropagateTask(emit, value, sink)
};

PropagateTask.end = function (value, sink) {
  return new PropagateTask(end$1, value, sink)
};

PropagateTask.error = function (value, sink) {
  return new PropagateTask(error$1, value, sink)
};

PropagateTask.prototype.dispose = function () {
  this.active = false;
};

PropagateTask.prototype.run = function (t) {
  if (!this.active) {
    return
  }
  this._run(t, this.value, this.sink);
};

PropagateTask.prototype.error = function (t, e) {
  if (!this.active) {
    return fatalError(e)
  }
  this.sink.error(t, e);
};

function error$1 (t, e, sink) {
  sink.error(t, e);
}

function emit (t, x, sink) {
  sink.event(t, x);
}

function end$1 (t, x, sink) {
  sink.end(t, x);
}

var Just = function Just (x) {
  this.value = x;
};

Just.prototype.run = function run (sink, scheduler) {
  return scheduler.asap(new PropagateTask(runJust, this.value, sink))
};

function runJust (t, x, sink) {
  sink.event(t, x);
  sink.end(t, void 0);
}

/**
 * Stream containing no events and ends immediately
 * @returns {Stream}
 */
var empty$$1 = function () { return EMPTY; };

var EmptySource = function EmptySource () {};

EmptySource.prototype.run = function run (sink, scheduler) {
  var task = PropagateTask.end(void 0, sink);
  scheduler.asap(task);

  return create(disposeEmpty, task)
};

var disposeEmpty = function (task) { return task.dispose(); };

var EMPTY = new Stream(new EmptySource());

var NeverSource = function NeverSource () {};

NeverSource.prototype.run = function run () {
  return empty$1()
};

var NEVER = new Stream(new NeverSource());

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Create a stream of events that occur at a regular period
 * @param {Number} period periodicity of events in millis
 * @returns {Stream} new stream of periodic events, the event value is undefined
 */
function periodic (period) {
  return new Stream(new Periodic(period))
}

var Periodic = function Periodic (period) {
  this.period = period;
};

Periodic.prototype.run = function run (sink, scheduler) {
  return scheduler.periodic(this.period, PropagateTask.event(undefined, sink))
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/*global Set, Symbol*/
var iteratorSymbol;
// Firefox ships a partial implementation using the name @@iterator.
// https://bugzilla.mozilla.org/show_bug.cgi?id=907077#c14
if (typeof Set === 'function' && typeof new Set()['@@iterator'] === 'function') {
  iteratorSymbol = '@@iterator';
} else {
  iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator ||
  '_es6shim_iterator_';
}



function getIterator (o) {
  return o[iteratorSymbol]()
}

var IterableSource = function IterableSource (iterable) {
  this.iterable = iterable;
};

IterableSource.prototype.run = function run (sink, scheduler) {
  return scheduler.asap(new PropagateTask(runProducer$1, getIterator(this.iterable), sink))
};

function runProducer$1 (t, iterator, sink) {
  var r = iterator.next();

  while (!r.done && this.active) {
    sink.event(t, r.value);
    r = iterator.next();
  }

  sink.end(t, r.value);
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var runEffects$1 = function (ref, scheduler) {
  var source = ref.source;

  return runSourceEffects(source, scheduler);
};

var runSourceEffects = function (source, scheduler) { return new Promise(function (resolve, reject) { return runSource(source, scheduler, resolve, reject); }); };

function runSource (source, scheduler, resolve, reject) {
  var disposable = settable();
  var observer = new RunEffectsSink(resolve, reject, disposable);

  disposable.setDisposable(source.run(observer, scheduler));
}

var RunEffectsSink = function RunEffectsSink (end, error, disposable) {
  this._end = end;
  this._error = error;
  this._disposable = disposable;
  this.active = true;
};

RunEffectsSink.prototype.event = function event (t, x) {};

RunEffectsSink.prototype.end = function end$1 (t, x) {
  if (!this.active) {
    return
  }
  this.active = false;
  disposeThen(this._end, this._error, this._disposable, x);
};

RunEffectsSink.prototype.error = function error$1 (t, e) {
  this.active = false;
  disposeThen(this._error, this._error, this._disposable, e);
};

var disposeThen = function (end, error, disposable, x) { return Promise.resolve(disposable.dispose()).then(function () { return end(x); }, error); };

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * A sink mixin that simply forwards event, end, and error to
 * another sink.
 * @param sink
 * @constructor
 */
function Pipe (sink) {
  this.sink = sink;
}

Pipe.prototype.event = function (t, x) {
  return this.sink.event(t, x)
};

Pipe.prototype.end = function (t, x) {
  return this.sink.end(t, x)
};

Pipe.prototype.error = function (t, e) {
  return this.sink.error(t, e)
};

var Scan = function Scan (f, z, source) {
  this.source = source;
  this.f = f;
  this.value = z;
};

Scan.prototype.run = function run (sink, scheduler) {
  var d1 = scheduler.asap(PropagateTask.event(this.value, sink));
  var d2 = this.source.run(new ScanSink(this.f, this.value, sink), scheduler);
  return all([d1, d2])
};

var ScanSink = (function (Pipe$$1) {
  function ScanSink (f, z, sink) {
    Pipe$$1.call(this);
    this.f = f;
    this.value = z;
    this.sink = sink;
  }

  if ( Pipe$$1 ) { ScanSink.__proto__ = Pipe$$1; }
  ScanSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  ScanSink.prototype.constructor = ScanSink;

  ScanSink.prototype.event = function event (t, x) {
    var f = this.f;
    this.value = f(this.value, x);
    this.sink.event(t, this.value);
  };

  return ScanSink;
}(Pipe));

function stepUnfold (unfold, x) {
  var f = unfold.f;
  return Promise.resolve(f(x)).then(function (tuple) {
    return continueUnfold(unfold, tuple)
  })
}

function continueUnfold (unfold, tuple) {
  if (tuple.done) {
    unfold.sink.end(unfold.scheduler.now(), tuple.value);
    return tuple.value
  }

  unfold.sink.event(unfold.scheduler.now(), tuple.value);

  if (!unfold.active) {
    return tuple.value
  }
  return stepUnfold(unfold, tuple.seed)
}

function stepIterate (iterate, x) {
  iterate.sink.event(iterate.scheduler.now(), x);

  if (!iterate.active) {
    return x
  }

  var f = iterate.f;
  return Promise.resolve(f(x)).then(function (y) {
    return continueIterate(iterate, y)
  })
}

function continueIterate (iterate, x) {
  return !iterate.active ? iterate.value : stepIterate(iterate, x)
}

function next (generate, x) {
  return generate.active ? handle(generate, generate.iterator.next(x)) : x
}

function handle (generate, result) {
  if (result.done) {
    return generate.sink.end(generate.scheduler.now(), result.value)
  }

  return Promise.resolve(result.value).then(function (x) {
    return emit$1(generate, x)
  }, function (e) {
    return error$1$1(generate, e)
  })
}

function emit$1 (generate, x) {
  generate.sink.event(generate.scheduler.now(), x);
  return next(generate, x)
}

function error$1$1 (generate, e) {
  return handle(generate, generate.iterator.throw(e))
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Filter (p, source) {
  this.p = p;
  this.source = source;
}

/**
 * Create a filtered source, fusing adjacent filter.filter if possible
 * @param {function(x:*):boolean} p filtering predicate
 * @param {{run:function}} source source to filter
 * @returns {Filter} filtered source
 */
Filter.create = function createFilter (p, source) {
  if (source instanceof Filter) {
    return new Filter(and(source.p, p), source.source)
  }

  return new Filter(p, source)
};

Filter.prototype.run = function (sink, scheduler) {
  return this.source.run(new FilterSink(this.p, sink), scheduler)
};

function FilterSink (p, sink) {
  this.p = p;
  this.sink = sink;
}

FilterSink.prototype.end = Pipe.prototype.end;
FilterSink.prototype.error = Pipe.prototype.error;

FilterSink.prototype.event = function (t, x) {
  var p = this.p;
  p(x) && this.sink.event(t, x);
};

function and (p, q) {
  return function (x) {
    return p(x) && q(x)
  }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function FilterMap (p, f, source) {
  this.p = p;
  this.f = f;
  this.source = source;
}

FilterMap.prototype.run = function (sink, scheduler) {
  return this.source.run(new FilterMapSink(this.p, this.f, sink), scheduler)
};

function FilterMapSink (p, f, sink) {
  this.p = p;
  this.f = f;
  this.sink = sink;
}

FilterMapSink.prototype.event = function (t, x) {
  var f = this.f;
  var p = this.p;
  p(x) && this.sink.event(t, f(x));
};

FilterMapSink.prototype.end = Pipe.prototype.end;
FilterMapSink.prototype.error = Pipe.prototype.error;

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Map$1 (f, source) {
  this.f = f;
  this.source = source;
}

/**
 * Create a mapped source, fusing adjacent map.map, filter.map,
 * and filter.map.map if possible
 * @param {function(*):*} f mapping function
 * @param {{run:function}} source source to map
 * @returns {Map|FilterMap} mapped source, possibly fused
 */
Map$1.create = function createMap (f, source) {
  if (source instanceof Map$1) {
    return new Map$1(compose(f, source.f), source.source)
  }

  if (source instanceof Filter) {
    return new FilterMap(source.p, f, source.source)
  }

  return new Map$1(f, source)
};

Map$1.prototype.run = function (sink, scheduler) { // eslint-disable-line no-extend-native
  return this.source.run(new MapSink(this.f, sink), scheduler)
};

function MapSink (f, sink) {
  this.f = f;
  this.sink = sink;
}

MapSink.prototype.end = Pipe.prototype.end;
MapSink.prototype.error = Pipe.prototype.error;

MapSink.prototype.event = function (t, x) {
  var f = this.f;
  this.sink.event(t, f(x));
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @param {Stream} stream stream to map
 * @returns {Stream} stream containing items transformed by f
 */
function map$2 (f, stream) {
  return new Stream(Map$1.create(f, stream.source))
}

/**
* Replace each value in the stream with x
* @param {*} x
* @param {Stream} stream
* @returns {Stream} stream containing items replaced with x
*/
function constant$1 (x, stream) {
  return map$2(function () {
    return x
  }, stream)
}

/**
* Perform a side effect for each item in the stream
* @param {function(x:*):*} f side effect to execute for each item. The
*  return value will be discarded.
* @param {Stream} stream stream to tap
* @returns {Stream} new stream containing the same items as this stream
*/
function tap$1 (f, stream) {
  return new Stream(new Tap(f, stream.source))
}

function Tap (f, source) {
  this.source = source;
  this.f = f;
}

Tap.prototype.run = function (sink, scheduler) {
  return this.source.run(new TapSink(this.f, sink), scheduler)
};

function TapSink (f, sink) {
  this.sink = sink;
  this.f = f;
}

TapSink.prototype.end = Pipe.prototype.end;
TapSink.prototype.error = Pipe.prototype.error;

TapSink.prototype.event = function (t, x) {
  var f = this.f;
  f(x);
  this.sink.event(t, x);
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function IndexSink (i, sink) {
  this.sink = sink;
  this.index = i;
  this.active = true;
  this.value = void 0;
}

IndexSink.prototype.event = function (t, x) {
  if (!this.active) {
    return
  }
  this.value = x;
  this.sink.event(t, this);
};

IndexSink.prototype.end = function (t, x) {
  if (!this.active) {
    return
  }
  this.active = false;
  this.sink.end(t, { index: this.index, value: x });
};

IndexSink.prototype.error = Pipe.prototype.error;

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function invoke (f, args) {
	/*eslint complexity: [2,7]*/
  switch (args.length) {
    case 0: return f()
    case 1: return f(args[0])
    case 2: return f(args[0], args[1])
    case 3: return f(args[0], args[1], args[2])
    case 4: return f(args[0], args[1], args[2], args[3])
    case 5: return f(args[0], args[1], args[2], args[3], args[4])
    default:
      return f.apply(void 0, args)
  }
}

function CombineSink (disposables, sinks, sink, f) {
  var this$1 = this;

  this.sink = sink;
  this.disposables = disposables;
  this.sinks = sinks;
  this.f = f;

  var l = sinks.length;
  this.awaiting = l;
  this.values = new Array(l);
  this.hasValue = new Array(l);
  for (var i = 0; i < l; ++i) {
    this$1.hasValue[i] = false;
  }

  this.activeCount = sinks.length;
}

CombineSink.prototype.error = Pipe.prototype.error;

CombineSink.prototype.event = function (t, indexedValue) {
  var i = indexedValue.index;
  var awaiting = this._updateReady(i);

  this.values[i] = indexedValue.value;
  if (awaiting === 0) {
    this.sink.event(t, invoke(this.f, this.values));
  }
};

CombineSink.prototype._updateReady = function (index) {
  if (this.awaiting > 0) {
    if (!this.hasValue[index]) {
      this.hasValue[index] = true;
      this.awaiting -= 1;
    }
  }
  return this.awaiting
};

CombineSink.prototype.end = function (t, indexedValue) {
  tryDispose(t, this.disposables[indexedValue.index], this.sink);
  if (--this.activeCount === 0) {
    this.sink.end(t, indexedValue.value);
  }
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Doubly linked list
 * @constructor
 */
function LinkedList () {
  this.head = null;
  this.length = 0;
}

/**
 * Add a node to the end of the list
 * @param {{prev:Object|null, next:Object|null, dispose:function}} x node to add
 */
LinkedList.prototype.add = function (x) {
  if (this.head !== null) {
    this.head.prev = x;
    x.next = this.head;
  }
  this.head = x;
  ++this.length;
};

/**
 * Remove the provided node from the list
 * @param {{prev:Object|null, next:Object|null, dispose:function}} x node to remove
 */
LinkedList.prototype.remove = function (x) { // eslint-disable-line  complexity
  --this.length;
  if (x === this.head) {
    this.head = this.head.next;
  }
  if (x.next !== null) {
    x.next.prev = x.prev;
    x.next = null;
  }
  if (x.prev !== null) {
    x.prev.next = x.next;
    x.prev = null;
  }
};

/**
 * @returns {boolean} true iff there are no nodes in the list
 */
LinkedList.prototype.isEmpty = function () {
  return this.length === 0
};

/**
 * Dispose all nodes
 * @returns {Promise} promise that fulfills when all nodes have been disposed,
 *  or rejects if an error occurs while disposing
 */
LinkedList.prototype.dispose = function () {
  if (this.isEmpty()) {
    return Promise.resolve()
  }

  var promises = [];
  var x = this.head;
  this.head = null;
  this.length = 0;

  while (x !== null) {
    promises.push(x.dispose());
    x = x.next;
  }

  return Promise.all(promises)
};

function mapAndRun (f, x, sink, scheduler) {
  return f(x).source.run(sink, scheduler)
}

function Inner (time, outer, sink) {
  this.prev = this.next = null;
  this.time = time;
  this.outer = outer;
  this.sink = sink;
  this.disposable = void 0;
}

Inner.prototype.event = function (t, x) {
  this.sink.event(Math.max(t, this.time), x);
};

Inner.prototype.end = function (t, x) {
  this.outer._endInner(Math.max(t, this.time), x, this);
};

Inner.prototype.error = function (t, e) {
  this.outer.error(Math.max(t, this.time), e);
};

Inner.prototype.dispose = function () {
  return this.disposable.dispose()
};

function MergeSink (disposables, sinks, sink) {
  this.sink = sink;
  this.disposables = disposables;
  this.activeCount = sinks.length;
}

MergeSink.prototype.error = Pipe.prototype.error;

MergeSink.prototype.event = function (t, indexValue) {
  this.sink.event(t, indexValue.value);
};

MergeSink.prototype.end = function (t, indexedValue) {
  tryDispose(t, this.disposables[indexedValue.index], this.sink);
  if (--this.activeCount === 0) {
    this.sink.end(t, indexedValue.value);
  }
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */

var sample$1 = function (f, sampler, stream) { return new Stream(new SampleSource(f, sampler, stream)); };

var SampleSource = function SampleSource (f, sampler, stream) {
  this.source = stream.source;
  this.sampler = sampler.source;
  this.f = f;
};

SampleSource.prototype.run = function run (sink, scheduler) {
  var sampleSink = new SampleSink(this.f, this.source, sink);
  var sourceDisposable = this.source.run(sampleSink.hold, scheduler);
  var samplerDisposable = this.sampler.run(sampleSink, scheduler);

  return all([samplerDisposable, sourceDisposable])
};

var SampleSink = (function (Pipe$$1) {
  function SampleSink (f, source, sink) {
    Pipe$$1.call(this, sink);
    this.sink = sink;
    this.source = source;
    this.f = f;
    this.hold = new SampleHold(this);
  }

  if ( Pipe$$1 ) { SampleSink.__proto__ = Pipe$$1; }
  SampleSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  SampleSink.prototype.constructor = SampleSink;

  SampleSink.prototype.event = function event (t, x) {
    if (this.hold.hasValue) {
      var f = this.f;
      this.sink.event(t, f(x, this.hold.value));
    }
  };

  return SampleSink;
}(Pipe));

var SampleHold = (function (Pipe$$1) {
  function SampleHold (sink) {
    Pipe$$1.call(this, sink);
    this.hasValue = false;
  }

  if ( Pipe$$1 ) { SampleHold.__proto__ = Pipe$$1; }
  SampleHold.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  SampleHold.prototype.constructor = SampleHold;

  SampleHold.prototype.event = function event (t, x) {
    this.value = x;
    this.hasValue = true;
  };

  SampleHold.prototype.end = function end$1 () {};

  return SampleHold;
}(Pipe));

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

// Based on https://github.com/petkaantonov/deque

function Queue (capPow2) {
  this._capacity = capPow2 || 32;
  this._length = 0;
  this._head = 0;
}

Queue.prototype.push = function (x) {
  var len = this._length;
  this._checkCapacity(len + 1);

  var i = (this._head + len) & (this._capacity - 1);
  this[i] = x;
  this._length = len + 1;
};

Queue.prototype.shift = function () {
  var head = this._head;
  var x = this[head];

  this[head] = void 0;
  this._head = (head + 1) & (this._capacity - 1);
  this._length--;
  return x
};

Queue.prototype.isEmpty = function () {
  return this._length === 0
};

Queue.prototype.length = function () {
  return this._length
};

Queue.prototype._checkCapacity = function (size) {
  if (this._capacity < size) {
    this._ensureCapacity(this._capacity << 1);
  }
};

Queue.prototype._ensureCapacity = function (capacity) {
  var oldCapacity = this._capacity;
  this._capacity = capacity;

  var last = this._head + this._length;

  if (last > oldCapacity) {
    copy$2(this, 0, this, oldCapacity, last & (oldCapacity - 1));
  }
};

function copy$2 (src, srcIndex, dst, dstIndex, len) {
  for (var j = 0; j < len; ++j) {
    dst[j + dstIndex] = src[j + srcIndex];
    src[j + srcIndex] = void 0;
  }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var map$4 = map$1;
var tail$2 = tail;

/**
 * Combine streams pairwise (or tuple-wise) by index by applying f to values
 * at corresponding indices.  The returned stream ends when any of the input
 * streams ends.
 * @param {function} f function to combine values
 * @returns {Stream} new stream with items at corresponding indices combined
 *  using f
 */
function zip (f /*, ...streams */) {
  return zipArray$1(f, tail$2(arguments))
}

/**
* Combine streams pairwise (or tuple-wise) by index by applying f to values
* at corresponding indices.  The returned stream ends when any of the input
* streams ends.
* @param {function} f function to combine values
* @param {[Stream]} streams streams to zip using f
* @returns {Stream} new stream with items at corresponding indices combined
*  using f
*/
function zipArray$1 (f, streams) {
  return streams.length === 0 ? empty$$1()
: streams.length === 1 ? map$2(f, streams[0])
: new Stream(new Zip(f, map$4(getSource$1, streams)))
}

function getSource$1 (stream) {
  return stream.source
}

function Zip (f, sources) {
  this.f = f;
  this.sources = sources;
}

Zip.prototype.run = function (sink, scheduler) {
  var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l);
  var sinks = new Array(l);
  var buffers = new Array(l);

  var zipSink = new ZipSink(this.f, buffers, sinks, sink);

  for (var indexSink, i = 0; i < l; ++i) {
    buffers[i] = new Queue();
    indexSink = sinks[i] = new IndexSink(i, zipSink);
    disposables[i] = this$1.sources[i].run(indexSink, scheduler);
  }

  return all(disposables)
};

function ZipSink (f, buffers, sinks, sink) {
  this.f = f;
  this.sinks = sinks;
  this.sink = sink;
  this.buffers = buffers;
}

ZipSink.prototype.event = function (t, indexedValue) { // eslint-disable-line complexity
  var buffers = this.buffers;
  var buffer = buffers[indexedValue.index];

  buffer.push(indexedValue.value);

  if (buffer.length() === 1) {
    if (!ready(this.buffers)) {
      return
    }

    emitZipped(this.f, t, buffers, this.sink);

    if (ended(this.buffers, this.sinks)) {
      this.sink.end(t, void 0);
    }
  }
};

ZipSink.prototype.end = function (t, indexedValue) {
  var buffer = this.buffers[indexedValue.index];
  if (buffer.isEmpty()) {
    this.sink.end(t, indexedValue.value);
  }
};

ZipSink.prototype.error = Pipe.prototype.error;

function emitZipped (f, t, buffers, sink) {
  sink.event(t, invoke(f, map$4(head, buffers)));
}

function head (buffer) {
  return buffer.shift()
}

function ended (buffers, sinks) {
  for (var i = 0, l = buffers.length; i < l; ++i) {
    if (buffers[i].isEmpty() && !sinks[i].active) {
      return true
    }
  }
  return false
}

function ready (buffers) {
  for (var i = 0, l = buffers.length; i < l; ++i) {
    if (buffers[i].isEmpty()) {
      return false
    }
  }
  return true
}

var Switch = function Switch (source) {
  this.source = source;
};

Switch.prototype.run = function run (sink, scheduler) {
  var switchSink = new SwitchSink(sink, scheduler);
  return all([switchSink, this.source.run(switchSink, scheduler)])
};

var SwitchSink = function SwitchSink (sink, scheduler) {
  this.sink = sink;
  this.scheduler = scheduler;
  this.current = null;
  this.ended = false;
};

SwitchSink.prototype.event = function event (t, stream) {
  this._disposeCurrent(t); // TODO: capture the result of this dispose
  this.current = new Segment(t, Infinity, this, this.sink);
  this.current.disposable = stream.source.run(this.current, this.scheduler);
};

SwitchSink.prototype.end = function end$1 (t, x) {
  this.ended = true;
  this._checkEnd(t, x);
};

SwitchSink.prototype.error = function error$1 (t, e) {
  this.ended = true;
  this.sink.error(t, e);
};

SwitchSink.prototype.dispose = function dispose () {
  return this._disposeCurrent(this.scheduler.now())
};

SwitchSink.prototype._disposeCurrent = function _disposeCurrent (t) {
  if (this.current !== null) {
    return this.current._dispose(t)
  }
};

SwitchSink.prototype._disposeInner = function _disposeInner (t, inner) {
  inner._dispose(t); // TODO: capture the result of this dispose
  if (inner === this.current) {
    this.current = null;
  }
};

SwitchSink.prototype._checkEnd = function _checkEnd (t, x) {
  if (this.ended && this.current === null) {
    this.sink.end(t, x);
  }
};

SwitchSink.prototype._endInner = function _endInner (t, x, inner) {
  this._disposeInner(t, inner);
  this._checkEnd(t, x);
};

SwitchSink.prototype._errorInner = function _errorInner (t, e, inner) {
  this._disposeInner(t, inner);
  this.sink.error(t, e);
};

var Segment = function Segment (min, max, outer, sink) {
  this.min = min;
  this.max = max;
  this.outer = outer;
  this.sink = sink;
  this.disposable = empty$1();
};

Segment.prototype.event = function event (t, x) {
  if (t < this.max) {
    this.sink.event(Math.max(t, this.min), x);
  }
};

Segment.prototype.end = function end$1 (t, x) {
  this.outer._endInner(Math.max(t, this.min), x, this);
};

Segment.prototype.error = function error$1 (t, e) {
  this.outer._errorInner(Math.max(t, this.min), e, this);
};

Segment.prototype._dispose = function _dispose (t) {
  this.max = t;
  tryDispose(t, this.disposable, this.sink);
};

function Slice (min, max, source) {
  this.source = source;
  this.min = min;
  this.max = max;
}

Slice.prototype.run = function (sink, scheduler) {
  return new SliceSink(this.min, this.max - this.min, this.source, sink, scheduler)
};

function SliceSink (skip, take, source, sink, scheduler) {
  this.sink = sink;
  this.skip = skip;
  this.take = take;
  this.disposable = once(source.run(this, scheduler));
}

SliceSink.prototype.end = Pipe.prototype.end;
SliceSink.prototype.error = Pipe.prototype.error;

SliceSink.prototype.event = function (t, x) { // eslint-disable-line complexity
  if (this.skip > 0) {
    this.skip -= 1;
    return
  }

  if (this.take === 0) {
    return
  }

  this.take -= 1;
  this.sink.event(t, x);
  if (this.take === 0) {
    this.dispose();
    this.sink.end(t, x);
  }
};

SliceSink.prototype.dispose = function () {
  return this.disposable.dispose()
};

var Await = function Await (source) {
  this.source = source;
};

Await.prototype.run = function run (sink, scheduler) {
  return this.source.run(new AwaitSink(sink, scheduler), scheduler)
};

var AwaitSink = function AwaitSink (sink, scheduler) {
  var this$1 = this;

  this.sink = sink;
  this.scheduler = scheduler;
  this.queue = Promise.resolve();

  // Pre-create closures, to avoid creating them per event
  this._eventBound = function (x) { return this$1.sink.event(this$1.scheduler.now(), x); };
  this._endBound = function (x) { return this$1.sink.end(this$1.scheduler.now(), x); };
  this._errorBound = function (e) { return this$1.sink.error(this$1.scheduler.now(), e); };
};

AwaitSink.prototype.event = function event (t, promise) {
    var this$1 = this;

  this.queue = this.queue.then(function () { return this$1._event(promise); })
    .catch(this._errorBound);
};

AwaitSink.prototype.end = function end$1 (t, x) {
    var this$1 = this;

  this.queue = this.queue.then(function () { return this$1._end(x); })
    .catch(this._errorBound);
};

AwaitSink.prototype.error = function error$1 (t, e) {
    var this$1 = this;

  // Don't resolve error values, propagate directly
  this.queue = this.queue.then(function () { return this$1._errorBound(e); })
    .catch(fatalError);
};

AwaitSink.prototype._event = function _event (promise) {
  return promise.then(this._eventBound)
};

AwaitSink.prototype._end = function _end (x) {
  return Promise.resolve(x).then(this._endBound)
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function SafeSink (sink) {
  this.sink = sink;
  this.active = true;
}

SafeSink.prototype.event = function (t, x) {
  if (!this.active) {
    return
  }
  this.sink.event(t, x);
};

SafeSink.prototype.end = function (t, x) {
  if (!this.active) {
    return
  }
  this.disable();
  this.sink.end(t, x);
};

SafeSink.prototype.error = function (t, e) {
  this.disable();
  this.sink.error(t, e);
};

SafeSink.prototype.disable = function () {
  this.active = false;
  return this.sink
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function ScheduledTask (delay, period, task, scheduler) {
  this.time = delay;
  this.period = period;
  this.task = task;
  this.scheduler = scheduler;
  this.active = true;
}

ScheduledTask.prototype.run = function () {
  return this.task.run(this.time)
};

ScheduledTask.prototype.error = function (e) {
  return this.task.error(this.time, e)
};

ScheduledTask.prototype.dispose = function () {
  this.scheduler.cancel(this);
  return this.task.dispose()
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function defer (task) {
  return Promise.resolve(task).then(runTask)
}

function runTask (task) {
  try {
    return task.run()
  } catch (e) {
    return task.error(e)
  }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Scheduler = function Scheduler (timer, timeline) {
  var this$1 = this;

  this.timer = timer;
  this.timeline = timeline;

  this._timer = null;
  this._nextArrival = Infinity;

  this._runReadyTasksBound = function () { return this$1._runReadyTasks(this$1.now()); };
};

Scheduler.prototype.now = function now () {
  return this.timer.now()
};

Scheduler.prototype.asap = function asap (task) {
  return this.schedule(0, -1, task)
};

Scheduler.prototype.delay = function delay (delay$1, task) {
  return this.schedule(delay$1, -1, task)
};

Scheduler.prototype.periodic = function periodic (period, task) {
  return this.schedule(0, period, task)
};

Scheduler.prototype.schedule = function schedule (delay, period, task) {
  var now = this.now();
  var st = new ScheduledTask(now + Math.max(0, delay), period, task, this);

  this.timeline.add(st);
  this._scheduleNextRun(now);
  return st
};

Scheduler.prototype.cancel = function cancel (task) {
  task.active = false;
  if (this.timeline.remove(task)) {
    this._reschedule();
  }
};

Scheduler.prototype.cancelAll = function cancelAll (f) {
  this.timeline.removeAll(f);
  this._reschedule();
};

Scheduler.prototype._reschedule = function _reschedule () {
  if (this.timeline.isEmpty()) {
    this._unschedule();
  } else {
    this._scheduleNextRun(this.now());
  }
};

Scheduler.prototype._unschedule = function _unschedule () {
  this.timer.clearTimer(this._timer);
  this._timer = null;
};

Scheduler.prototype._scheduleNextRun = function _scheduleNextRun (now) { // eslint-disable-line complexity
  if (this.timeline.isEmpty()) {
    return
  }

  var nextArrival = this.timeline.nextArrival();

  if (this._timer === null) {
    this._scheduleNextArrival(nextArrival, now);
  } else if (nextArrival < this._nextArrival) {
    this._unschedule();
    this._scheduleNextArrival(nextArrival, now);
  }
};

Scheduler.prototype._scheduleNextArrival = function _scheduleNextArrival (nextArrival, now) {
  this._nextArrival = nextArrival;
  var delay = Math.max(0, nextArrival - now);
  this._timer = this.timer.setTimer(this._runReadyTasksBound, delay);
};

Scheduler.prototype._runReadyTasks = function _runReadyTasks (now) {
  this._timer = null;
  this.timeline.runTasks(now, runTask);
  this._scheduleNextRun(this.now());
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Timeline = function Timeline () {
  this.tasks = [];
};

Timeline.prototype.nextArrival = function nextArrival () {
  return this.isEmpty() ? Infinity : this.tasks[0].time
};

Timeline.prototype.isEmpty = function isEmpty () {
  return this.tasks.length === 0
};

Timeline.prototype.add = function add (st) {
  insertByTime(st, this.tasks);
};

Timeline.prototype.remove = function remove$$1 (st) {
  var i = binarySearch(st.time, this.tasks);

  if (i >= 0 && i < this.tasks.length) {
    var at = findIndex(st, this.tasks[i].events);
    if (at >= 0) {
      this.tasks[i].events.splice(at, 1);
      return true
    }
  }

  return false
};

Timeline.prototype.removeAll = function removeAll$$1 (f) {
    var this$1 = this;

  for (var i = 0; i < this.tasks.length; ++i) {
    removeAllFrom(f, this$1.tasks[i]);
  }
};

Timeline.prototype.runTasks = function runTasks (t, runTask) {
    var this$1 = this;

  var tasks = this.tasks;
  var l = tasks.length;
  var i = 0;

  while (i < l && tasks[i].time <= t) {
    ++i;
  }

  this.tasks = tasks.slice(i);

  // Run all ready tasks
  for (var j = 0; j < i; ++j) {
    this$1.tasks = runReadyTasks(runTask, tasks[j].events, this$1.tasks);
  }
};

function runReadyTasks (runTask, events, tasks) { // eslint-disable-line complexity
  for (var i = 0; i < events.length; ++i) {
    var task = events[i];

    if (task.active) {
      runTask(task);

      // Reschedule periodic repeating tasks
      // Check active again, since a task may have canceled itself
      if (task.period >= 0 && task.active) {
        task.time = task.time + task.period;
        insertByTime(task, tasks);
      }
    }
  }

  return tasks
}

function insertByTime (task, timeslots) { // eslint-disable-line complexity
  var l = timeslots.length;

  if (l === 0) {
    timeslots.push(newTimeslot(task.time, [task]));
    return
  }

  var i = binarySearch(task.time, timeslots);

  if (i >= l) {
    timeslots.push(newTimeslot(task.time, [task]));
  } else if (task.time === timeslots[i].time) {
    timeslots[i].events.push(task);
  } else {
    timeslots.splice(i, 0, newTimeslot(task.time, [task]));
  }
}

function removeAllFrom (f, timeslot) {
  timeslot.events = removeAll(f, timeslot.events);
}

function binarySearch (t, sortedArray) { // eslint-disable-line complexity
  var lo = 0;
  var hi = sortedArray.length;
  var mid, y;

  while (lo < hi) {
    mid = Math.floor((lo + hi) / 2);
    y = sortedArray[mid];

    if (t === y.time) {
      return mid
    } else if (t < y.time) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return hi
}

var newTimeslot = function (t, events) { return ({ time: t, events: events }); };

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/*global setTimeout, clearTimeout*/

var ClockTimer = function ClockTimer () {
  this.now = Date.now;
};

ClockTimer.prototype.setTimer = function setTimer (f, dt) {
  return dt <= 0 ? runAsap(f) : setTimeout(f, dt)
};

ClockTimer.prototype.clearTimer = function clearTimer (t) {
  return t instanceof Asap ? t.cancel() : clearTimeout(t)
};

var Asap = function Asap (f) {
  this.f = f;
  this.active = true;
};

Asap.prototype.run = function run () {
  return this.active && this.f()
};

Asap.prototype.error = function error$1 (e) {
  throw e
};

Asap.prototype.cancel = function cancel () {
  this.active = false;
};

function runAsap (f) {
  var task = new Asap(f);
  defer(task);
  return task
}

/** @license MIT License (c) copyright 2016 original author or authors */
// -----------------------------------------------------------------------
// Observing

var runEffects$$1 = curry2(runEffects$1);

// -----------------------------------------------------------------------
// Transforming

var map$$1 = curry2(map$2);
var constant$$1 = curry2(constant$1);
var tap$$1 = curry2(tap$1);
// -----------------------------------------------------------------------
// Sampling

var sample$$1 = curry3(sample$1);

// -----------------------------------------------------------------------
// Scheduler components

// export the Scheduler components for third-party libraries
var _newScheduler = function (timer, timeline) { return new Scheduler(timer, timeline); };

var newTimeline = function () { return new Timeline(); };
var newClockTimer = function () { return new ClockTimer(); };

var newDefaultScheduler = function () { return _newScheduler(newClockTimer(), newTimeline()); };

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// Non-mutating array operations

// cons :: a -> [a] -> [a]
// a with x prepended
function cons (x, a) {
  var l = a.length;
  var b = new Array(l + 1);
  b[0] = x;
  for (var i = 0; i < l; ++i) {
    b[i + 1] = a[i];
  }
  return b
}

// append :: a -> [a] -> [a]
// a with x appended
function append (x, a) {
  var l = a.length;
  var b = new Array(l + 1);
  for (var i = 0; i < l; ++i) {
    b[i] = a[i];
  }

  b[l] = x;
  return b
}

// drop :: Int -> [a] -> [a]
// drop first n elements
function drop$1 (n, a) { // eslint-disable-line complexity
  if (n < 0) {
    throw new TypeError('n must be >= 0')
  }

  var l = a.length;
  if (n === 0 || l === 0) {
    return a
  }

  if (n >= l) {
    return []
  }

  return unsafeDrop$1(n, a, l - n)
}

// unsafeDrop :: Int -> [a] -> Int -> [a]
// Internal helper for drop
function unsafeDrop$1 (n, a, l) {
  var b = new Array(l);
  for (var i = 0; i < l; ++i) {
    b[i] = a[n + i];
  }
  return b
}

// tail :: [a] -> [a]
// drop head element
function tail$1$1 (a) {
  return drop$1(1, a)
}

// copy :: [a] -> [a]
// duplicate a (shallow duplication)


// map :: (a -> b) -> [a] -> [b]
// transform each element with f
function map$1$1 (f, a) {
  var l = a.length;
  var b = new Array(l);
  for (var i = 0; i < l; ++i) {
    b[i] = f(a[i]);
  }
  return b
}

// reduce :: (a -> b -> a) -> a -> [b] -> a
// accumulate via left-fold
function reduce$1$1 (f, z, a) {
  var r = z;
  for (var i = 0, l = a.length; i < l; ++i) {
    r = f(r, a[i], i);
  }
  return r
}

// replace :: a -> Int -> [a]
// replace element at index
function replace (x, i, a) { // eslint-disable-line complexity
  if (i < 0) {
    throw new TypeError('i must be >= 0')
  }

  var l = a.length;
  var b = new Array(l);
  for (var j = 0; j < l; ++j) {
    b[j] = i === j ? x : a[j];
  }
  return b
}

// remove :: Int -> [a] -> [a]
// remove element at index
function remove (i, a) {  // eslint-disable-line complexity
  if (i < 0) {
    throw new TypeError('i must be >= 0')
  }

  var l = a.length;
  if (l === 0 || i >= l) { // exit early if index beyond end of array
    return a
  }

  if (l === 1) { // exit early if index in bounds and length === 1
    return []
  }

  return unsafeRemove(i, a, l - 1)
}

// unsafeRemove :: Int -> [a] -> Int -> [a]
// Internal helper to remove element at index
function unsafeRemove (i, a, l) {
  var b = new Array(l);
  var j;
  for (j = 0; j < i; ++j) {
    b[j] = a[j];
  }
  for (j = i; j < l; ++j) {
    b[j] = a[j + 1];
  }

  return b
}

// removeAll :: (a -> boolean) -> [a] -> [a]
// remove all elements matching a predicate
function removeAll$1 (f, a) {
  var l = a.length;
  var b = new Array(l);
  var j = 0;
  for (var x = (void 0), i = 0; i < l; ++i) {
    x = a[i];
    if (!f(x)) {
      b[j] = x;
      ++j;
    }
  }

  b.length = j;
  return b
}

// findIndex :: a -> [a] -> Int
// find index of x in a, from the left
function findIndex$1 (x, a) {
  for (var i = 0, l = a.length; i < l; ++i) {
    if (x === a[i]) {
      return i
    }
  }
  return -1
}

// isArrayLike :: * -> boolean
// Return true iff x is array-like
function isArrayLike (x) {
  return x != null && typeof x.length === 'number' && typeof x !== 'function'
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// id :: a -> a
var id$1 = function (x) { return x; };

// compose :: (b -> c) -> (a -> b) -> (a -> c)
var compose$1 = function (f, g) { return function (x) { return f(g(x)); }; };

// apply :: (a -> b) -> a -> b
var apply$1 = function (f, x) { return f(x); };

// curry2 :: ((a, b) -> c) -> (a -> b -> c)
function curry2$1 (f) {
  function curried (a, b) {
    switch (arguments.length) {
      case 0: return curried
      case 1: return function (b) { return f(a, b); }
      default: return f(a, b)
    }
  }
  return curried
}

// curry3 :: ((a, b, c) -> d) -> (a -> b -> c -> d)
function curry3$1 (f) {
  function curried (a, b, c) { // eslint-disable-line complexity
    switch (arguments.length) {
      case 0: return curried
      case 1: return curry2$1(function (b, c) { return f(a, b, c); })
      case 2: return function (c) { return f(a, b, c); }
      default:return f(a, b, c)
    }
  }
  return curried
}

/** @license MIT License (c) copyright 2016 original author or authors */

var MulticastDisposable = function MulticastDisposable (source, sink) {
  this.source = source;
  this.sink = sink;
  this.disposed = false;
};

MulticastDisposable.prototype.dispose = function dispose$1$1 () {
  if (this.disposed) {
    return
  }
  this.disposed = true;
  var remaining = this.source.remove(this.sink);
  return remaining === 0 && this.source._dispose()
};

function tryEvent$1 (t, x, sink) {
  try {
    sink.event(t, x);
  } catch (e) {
    sink.error(t, e);
  }
}

function tryEnd$1 (t, x, sink) {
  try {
    sink.end(t, x);
  } catch (e) {
    sink.error(t, e);
  }
}

var dispose$1$1 = function (disposable) { return disposable.dispose(); };

var emptyDisposable = {
  dispose: function dispose$1 () {}
};

var MulticastSource = function MulticastSource (source) {
  this.source = source;
  this.sinks = [];
  this._disposable = emptyDisposable;
};

MulticastSource.prototype.run = function run (sink, scheduler) {
  var n = this.add(sink);
  if (n === 1) {
    this._disposable = this.source.run(this, scheduler);
  }
  return new MulticastDisposable(this, sink)
};

MulticastSource.prototype._dispose = function _dispose () {
  var disposable = this._disposable;
  this._disposable = emptyDisposable;
  return Promise.resolve(disposable).then(dispose$1$1)
};

MulticastSource.prototype.add = function add (sink) {
  this.sinks = append(sink, this.sinks);
  return this.sinks.length
};

MulticastSource.prototype.remove = function remove$1 (sink) {
  var i = findIndex$1(sink, this.sinks);
  // istanbul ignore next
  if (i >= 0) {
    this.sinks = remove(i, this.sinks);
  }

  return this.sinks.length
};

MulticastSource.prototype.event = function event (time, value) {
  var s = this.sinks;
  if (s.length === 1) {
    return s[0].event(time, value)
  }
  for (var i = 0; i < s.length; ++i) {
    tryEvent$1(time, value, s[i]);
  }
};

MulticastSource.prototype.end = function end (time, value) {
  var s = this.sinks;
  for (var i = 0; i < s.length; ++i) {
    tryEnd$1(time, value, s[i]);
  }
};

MulticastSource.prototype.error = function error (time, err) {
  var s = this.sinks;
  for (var i = 0; i < s.length; ++i) {
    s[i].error(time, err);
  }
};

function multicast (stream) {
  var source = stream.source;
  return source instanceof MulticastSource
    ? stream
    : new stream.constructor(new MulticastSource(source))
}

// ------------------------------------------------------
// Event helpers

var mapWithTimeE = function (f, stream) { return new stream.constructor({
  run: function run (sink, scheduler) {
    return stream.source.run(new MapWithTimeSink(f, sink), scheduler)
  }
}); };

var MapWithTimeSink = function MapWithTimeSink (f, sink) {
  this.f = f;
  this.sink = sink;
};

MapWithTimeSink.prototype.event = function event (t, x) {
  var f = this.f;
  this.sink.event(t, f(t, x));
};

MapWithTimeSink.prototype.error = function error (t, e) {
  this.sink.error(t, e);
};

MapWithTimeSink.prototype.end = function end (t, x) {
  this.sink.end(t, x);
};

// Possibly useful:
// - accum :: a -> Event (a -> a) -> Behavior a
//    accum :: (a -> b -> c) -> a -> Event b -> Behavior c
// - count :: Event a -> Behavior number
// - when :: Behavior bool -> Event a -> Event a

var sample$$2 = curry2$1(function (event, behavior) { return behavior.sample(event); });

var snapshot = curry3$1(function (f, event, behavior) { return behavior.snapshot(f, event); });

// Base Behavior typeclass
// Implementations MUST define at least one of sample or snapshot, and
// MAY define both as an optimization
var Behavior = function Behavior () {};

Behavior.prototype.sample = function sample$$2 (event) {
  return this.snapshot(snd, event)
};

Behavior.prototype.snapshot = function snapshot (f, event) {
  var me = multicast(event);
  return sample$$1(f, this.sample(me), me)
};

var always = function (x) { return new Constant(x); };

var Constant = (function (Behavior) {
  function Constant (value) {
    Behavior.call(this);
    this.value = value;
  }

  if ( Behavior ) Constant.__proto__ = Behavior;
  Constant.prototype = Object.create( Behavior && Behavior.prototype );
  Constant.prototype.constructor = Constant;

  Constant.prototype.sample = function sample$$2 (event) {
    return constant$$1(this.value, event)
  };

  Constant.prototype.snapshot = function snapshot (f, event) {
    var this$1 = this;

    return map$$1(function (a) { return f(a, this$1.value); }, event)
  };

  return Constant;
}(Behavior));

var Computed = (function (Behavior) {
  function Computed (f) {
    Behavior.call(this);
    this.f = f;
  }

  if ( Behavior ) Computed.__proto__ = Behavior;
  Computed.prototype = Object.create( Behavior && Behavior.prototype );
  Computed.prototype.constructor = Computed;

  Computed.prototype.sample = function sample$$2 (event) {
    return mapWithTimeE(this.f, event)
  };

  Computed.prototype.snapshot = function snapshot (g, event) {
    var f = this.f;
    return mapWithTimeE(function (t, a) { return g(a, f(t, a)); }, event)
  };

  return Computed;
}(Behavior));

var getTime = function (t, x) { return t; };
var time = new Computed(getTime);



var snd = function (a, b) { return b; };

var map$$2 = curry2$1(function (f, behavior) { return new Map(f, behavior); });

var Map = (function (Behavior) {
  function Map (f, behavior) {
    Behavior.call(this);
    this.f = f;
    this.behavior = behavior;
  }

  if ( Behavior ) Map.__proto__ = Behavior;
  Map.prototype = Object.create( Behavior && Behavior.prototype );
  Map.prototype.constructor = Map;

  Map.prototype.sample = function sample$$2 (event) {
    return map$$1(this.f, this.behavior.sample(event))
  };

  Map.prototype.snapshot = function snapshot (g, event) {
    var f = this.f;
    return this.behavior.snapshot(function (a, b) { return g(a, f(b)); }, event)
  };

  return Map;
}(Behavior));

var liftA2 = curry3$1(function (f, b1, b2) { return new LiftA2(f, b1, b2); });

var LiftA2 = (function (Behavior) {
  function LiftA2 (f, b1, b2) {
    Behavior.call(this);
    this.f = f;
    this.b1 = b1;
    this.b2 = b2;
  }

  if ( Behavior ) LiftA2.__proto__ = Behavior;
  LiftA2.prototype = Object.create( Behavior && Behavior.prototype );
  LiftA2.prototype.constructor = LiftA2;

  LiftA2.prototype.sample = function sample$$2 (event) {
    var s = multicast(event);
    return zip(this.f, this.b1.sample(s), this.b2.sample(s))
  };

  return LiftA2;
}(Behavior));

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Stream$1 (source) {
  this.source = source;
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Create a new Disposable which will dispose its underlying resource.
 * @param {function} dispose function
 * @param {*?} data any data to be passed to disposer function
 * @constructor
 */
function Disposable$1 (dispose, data) {
  this._dispose = dispose;
  this._data = data;
}

Disposable$1.prototype.dispose = function () {
  return this._dispose(this._data)
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function SettableDisposable$1 () {
  this.disposable = void 0;
  this.disposed = false;
  this._resolve = void 0;

  var self = this;
  this.result = new Promise(function (resolve) {
    self._resolve = resolve;
  });
}

SettableDisposable$1.prototype.setDisposable = function (disposable) {
  if (this.disposable !== void 0) {
    throw new Error('setDisposable called more than once')
  }

  this.disposable = disposable;

  if (this.disposed) {
    this._resolve(disposable.dispose());
  }
};

SettableDisposable$1.prototype.dispose = function () {
  if (this.disposed) {
    return this.result
  }

  this.disposed = true;

  if (this.disposable !== void 0) {
    this.result = this.disposable.dispose();
  }

  return this.result
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function isPromise$1 (p) {
  return p !== null && typeof p === 'object' && typeof p.then === 'function'
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */
var map$2$1 = map$1$1;
var identity = id$1;

/**
 * Call disposable.dispose.  If it returns a promise, catch promise
 * error and forward it through the provided sink.
 * @param {number} t time
 * @param {{dispose: function}} disposable
 * @param {{error: function}} sink
 * @return {*} result of disposable.dispose
 */
function tryDispose$1 (t, disposable, sink) {
  var result = disposeSafely$1(disposable);
  return isPromise$1(result)
    ? result.catch(function (e) {
      sink.error(t, e);
    })
    : result
}

/**
 * Create a new Disposable which will dispose its underlying resource
 * at most once.
 * @param {function} dispose function
 * @param {*?} data any data to be passed to disposer function
 * @return {Disposable}
 */
function create$1 (dispose, data) {
  return once$1(new Disposable$1(dispose, data))
}

/**
 * Create a noop disposable. Can be used to satisfy a Disposable
 * requirement when no actual resource needs to be disposed.
 * @return {Disposable|exports|module.exports}
 */
function empty$1$1 () {
  return new Disposable$1(identity, void 0)
}

/**
 * Create a disposable that will dispose all input disposables in parallel.
 * @param {Array<Disposable>} disposables
 * @return {Disposable}
 */
function all$1 (disposables) {
  return create$1(disposeAll$1, disposables)
}

function disposeAll$1 (disposables) {
  return Promise.all(map$2$1(disposeSafely$1, disposables))
}

function disposeSafely$1 (disposable) {
  try {
    return disposable.dispose()
  } catch (e) {
    return Promise.reject(e)
  }
}

/**
 * Create a disposable from a promise for another disposable
 * @param {Promise<Disposable>} disposablePromise
 * @return {Disposable}
 */


/**
 * Create a disposable proxy that allows its underlying disposable to
 * be set later.
 * @return {SettableDisposable}
 */
function settable$1 () {
  return new SettableDisposable$1()
}

/**
 * Wrap an existing disposable (which may not already have been once()d)
 * so that it will only dispose its underlying resource at most once.
 * @param {{ dispose: function() }} disposable
 * @return {Disposable} wrapped disposable
 */
function once$1 (disposable) {
  return new Disposable$1(disposeMemoized, memoized(disposable))
}

function disposeMemoized (memoized) {
  if (!memoized.disposed) {
    memoized.disposed = true;
    memoized.value = disposeSafely$1(memoized.disposable);
    memoized.disposable = void 0;
  }

  return memoized.value
}

function memoized (disposable) {
  return { disposed: false, disposable: disposable, value: void 0 }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function fatalError$1 (e) {
  setTimeout(function () {
    throw e
  }, 0);
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function PropagateTask$1 (run, value, sink) {
  this._run = run;
  this.value = value;
  this.sink = sink;
  this.active = true;
}

PropagateTask$1.event = function (value, sink) {
  return new PropagateTask$1(emit$1$1, value, sink)
};

PropagateTask$1.end = function (value, sink) {
  return new PropagateTask$1(end$2, value, sink)
};

PropagateTask$1.error = function (value, sink) {
  return new PropagateTask$1(error$3, value, sink)
};

PropagateTask$1.prototype.dispose = function () {
  this.active = false;
};

PropagateTask$1.prototype.run = function (t) {
  if (!this.active) {
    return
  }
  this._run(t, this.value, this.sink);
};

PropagateTask$1.prototype.error = function (t, e) {
  if (!this.active) {
    return fatalError$1(e)
  }
  this.sink.error(t, e);
};

function error$3 (t, e, sink) {
  sink.error(t, e);
}

function emit$1$1 (t, x, sink) {
  sink.event(t, x);
}

function end$2 (t, x, sink) {
  sink.end(t, x);
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Stream containing only x
 * @param {*} x
 * @returns {Stream}
 */
function of (x) {
  return new Stream$1(new Just$1(x))
}

function Just$1 (x) {
  this.value = x;
}

Just$1.prototype.run = function (sink, scheduler) {
  return scheduler.asap(new PropagateTask$1(runJust$1, this.value, sink))
};

function runJust$1 (t, x, sink) {
  sink.event(t, x);
  sink.end(t, void 0);
}

/**
 * Stream containing no events and ends immediately
 * @returns {Stream}
 */
function empty$$1 () {
  return EMPTY$1
}

function EmptySource$1 () {}

EmptySource$1.prototype.run = function (sink, scheduler) {
  var task = PropagateTask$1.end(void 0, sink);
  scheduler.asap(task);

  return create$1(disposeEmpty$1, task)
};

function disposeEmpty$1 (task) {
  return task.dispose()
}

var EMPTY$1 = new Stream$1(new EmptySource$1());

/**
 * Stream containing no events and never ends
 * @returns {Stream}
 */


function NeverSource$1 () {}

NeverSource$1.prototype.run = function () {
  return empty$1$1()
};

var NEVER$1 = new Stream$1(new NeverSource$1());

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function fromArray$1 (a) {
  return new Stream$1(new ArraySource$1(a))
}

function ArraySource$1 (a) {
  this.array = a;
}

ArraySource$1.prototype.run = function (sink, scheduler) {
  return scheduler.asap(new PropagateTask$1(runProducer$1$1, this.array, sink))
};

function runProducer$1$1 (t, array, sink) {
  for (var i = 0, l = array.length; i < l && this.active; ++i) {
    sink.event(t, array[i]);
  }

  this.active && end(t);

  function end (t) {
    sink.end(t);
  }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/*global Set, Symbol*/
var iteratorSymbol$1;
// Firefox ships a partial implementation using the name @@iterator.
// https://bugzilla.mozilla.org/show_bug.cgi?id=907077#c14
if (typeof Set === 'function' && typeof new Set()['@@iterator'] === 'function') {
  iteratorSymbol$1 = '@@iterator';
} else {
  iteratorSymbol$1 = typeof Symbol === 'function' && Symbol.iterator ||
  '_es6shim_iterator_';
}

function isIterable (o) {
  return typeof o[iteratorSymbol$1] === 'function'
}

function getIterator$1 (o) {
  return o[iteratorSymbol$1]()
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function fromIterable$1 (iterable) {
  return new Stream$1(new IterableSource$1(iterable))
}

function IterableSource$1 (iterable) {
  this.iterable = iterable;
}

IterableSource$1.prototype.run = function (sink, scheduler) {
  return scheduler.asap(new PropagateTask$1(runProducer$2, getIterator$1(this.iterable), sink))
};

function runProducer$2 (t, iterator, sink) {
  var r = iterator.next();

  while (!r.done && this.active) {
    sink.event(t, r.value);
    r = iterator.next();
  }

  sink.end(t, r.value);
}

function symbolObservablePonyfill(root) {
	var result;
	var Symbol = root.Symbol;

	if (typeof Symbol === 'function') {
		if (Symbol.observable) {
			result = Symbol.observable;
		} else {
			result = Symbol('observable');
			Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
}

/* global window */
var root;

if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (typeof module !== 'undefined') {
  root = module;
} else {
  root = Function('return this')();
}

var result = symbolObservablePonyfill(root);

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function getObservable (o) { // eslint-disable-line complexity
  var obs = null;
  if (o) {
  // Access foreign method only once
    var method = o[result];
    if (typeof method === 'function') {
      obs = method.call(o);
      if (!(obs && typeof obs.subscribe === 'function')) {
        throw new TypeError('invalid observable ' + obs)
      }
    }
  }

  return obs
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function fromObservable (observable) {
  return new Stream$1(new ObservableSource(observable))
}

function ObservableSource (observable) {
  this.observable = observable;
}

ObservableSource.prototype.run = function (sink, scheduler) {
  var sub = this.observable.subscribe(new SubscriberSink(sink, scheduler));
  if (typeof sub === 'function') {
    return create$1(sub)
  } else if (sub && typeof sub.unsubscribe === 'function') {
    return create$1(unsubscribe, sub)
  }

  throw new TypeError('Observable returned invalid subscription ' + String(sub))
};

function SubscriberSink (sink, scheduler) {
  this.sink = sink;
  this.scheduler = scheduler;
}

SubscriberSink.prototype.next = function (x) {
  this.sink.event(this.scheduler.now(), x);
};

SubscriberSink.prototype.complete = function (x) {
  this.sink.end(this.scheduler.now(), x);
};

SubscriberSink.prototype.error = function (e) {
  this.sink.error(this.scheduler.now(), e);
};

function unsubscribe (subscription) {
  return subscription.unsubscribe()
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function from (a) { // eslint-disable-line complexity
  if (a instanceof Stream$1) {
    return a
  }

  var observable = getObservable(a);
  if (observable != null) {
    return fromObservable(observable)
  }

  if (Array.isArray(a) || isArrayLike(a)) {
    return fromArray$1(a)
  }

  if (isIterable(a)) {
    return fromIterable$1(a)
  }

  throw new TypeError('from(x) must be observable, iterable, or array-like: ' + a)
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Create a stream that emits the current time periodically
 * @param {Number} period periodicity of events in millis
 * @param {*} deprecatedValue @deprecated value to emit each period
 * @returns {Stream} new stream that emits the current time every period
 */

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function ScheduledTask$1 (delay, period, task, scheduler) {
  this.time = delay;
  this.period = period;
  this.task = task;
  this.scheduler = scheduler;
  this.active = true;
}

ScheduledTask$1.prototype.run = function () {
  return this.task.run(this.time)
};

ScheduledTask$1.prototype.error = function (e) {
  return this.task.error(this.time, e)
};

ScheduledTask$1.prototype.dispose = function () {
  this.scheduler.cancel(this);
  return this.task.dispose()
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function defer$1 (task) {
  return Promise.resolve(task).then(runTask$1)
}

function runTask$1 (task) {
  try {
    return task.run()
  } catch (e) {
    return task.error(e)
  }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Scheduler$1 (timer, timeline) {
  this.timer = timer;
  this.timeline = timeline;

  this._timer = null;
  this._nextArrival = Infinity;

  var self = this;
  this._runReadyTasksBound = function () {
    self._runReadyTasks(self.now());
  };
}

Scheduler$1.prototype.now = function () {
  return this.timer.now()
};

Scheduler$1.prototype.asap = function (task) {
  return this.schedule(0, -1, task)
};

Scheduler$1.prototype.delay = function (delay, task) {
  return this.schedule(delay, -1, task)
};

Scheduler$1.prototype.periodic = function (period, task) {
  return this.schedule(0, period, task)
};

Scheduler$1.prototype.schedule = function (delay, period, task) {
  var now = this.now();
  var st = new ScheduledTask$1(now + Math.max(0, delay), period, task, this);

  this.timeline.add(st);
  this._scheduleNextRun(now);
  return st
};

Scheduler$1.prototype.cancel = function (task) {
  task.active = false;
  if (this.timeline.remove(task)) {
    this._reschedule();
  }
};

Scheduler$1.prototype.cancelAll = function (f) {
  this.timeline.removeAll(f);
  this._reschedule();
};

Scheduler$1.prototype._reschedule = function () {
  if (this.timeline.isEmpty()) {
    this._unschedule();
  } else {
    this._scheduleNextRun(this.now());
  }
};

Scheduler$1.prototype._unschedule = function () {
  this.timer.clearTimer(this._timer);
  this._timer = null;
};

Scheduler$1.prototype._scheduleNextRun = function (now) { // eslint-disable-line complexity
  if (this.timeline.isEmpty()) {
    return
  }

  var nextArrival = this.timeline.nextArrival();

  if (this._timer === null) {
    this._scheduleNextArrival(nextArrival, now);
  } else if (nextArrival < this._nextArrival) {
    this._unschedule();
    this._scheduleNextArrival(nextArrival, now);
  }
};

Scheduler$1.prototype._scheduleNextArrival = function (nextArrival, now) {
  this._nextArrival = nextArrival;
  var delay = Math.max(0, nextArrival - now);
  this._timer = this.timer.setTimer(this._runReadyTasksBound, delay);
};

Scheduler$1.prototype._runReadyTasks = function (now) {
  this._timer = null;
  this.timeline.runTasks(now, runTask$1);
  this._scheduleNextRun(this.now());
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/*global setTimeout, clearTimeout*/

function ClockTimer$1 () {}

ClockTimer$1.prototype.now = Date.now;

ClockTimer$1.prototype.setTimer = function (f, dt) {
  return dt <= 0 ? runAsap$1(f) : setTimeout(f, dt)
};

ClockTimer$1.prototype.clearTimer = function (t) {
  return t instanceof Asap$1 ? t.cancel() : clearTimeout(t)
};

function Asap$1 (f) {
  this.f = f;
  this.active = true;
}

Asap$1.prototype.run = function () {
  return this.active && this.f()
};

Asap$1.prototype.error = function (e) {
  throw e
};

Asap$1.prototype.cancel = function () {
  this.active = false;
};

function runAsap$1 (f) {
  var task = new Asap$1(f);
  defer$1(task);
  return task
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Timeline$1 () {
  this.tasks = [];
}

Timeline$1.prototype.nextArrival = function () {
  return this.isEmpty() ? Infinity : this.tasks[0].time
};

Timeline$1.prototype.isEmpty = function () {
  return this.tasks.length === 0
};

Timeline$1.prototype.add = function (st) {
  insertByTime$1(st, this.tasks);
};

Timeline$1.prototype.remove = function (st) {
  var i = binarySearch$1(st.time, this.tasks);

  if (i >= 0 && i < this.tasks.length) {
    var at = findIndex$1(st, this.tasks[i].events);
    if (at >= 0) {
      this.tasks[i].events.splice(at, 1);
      return true
    }
  }

  return false
};

Timeline$1.prototype.removeAll = function (f) {
  var this$1 = this;

  for (var i = 0, l = this.tasks.length; i < l; ++i) {
    removeAllFrom$1(f, this$1.tasks[i]);
  }
};

Timeline$1.prototype.runTasks = function (t, runTask) {
  var this$1 = this;

  var tasks = this.tasks;
  var l = tasks.length;
  var i = 0;

  while (i < l && tasks[i].time <= t) {
    ++i;
  }

  this.tasks = tasks.slice(i);

  // Run all ready tasks
  for (var j = 0; j < i; ++j) {
    this$1.tasks = runTasks$1(runTask, tasks[j], this$1.tasks);
  }
};

function runTasks$1 (runTask, timeslot, tasks) { // eslint-disable-line complexity
  var events = timeslot.events;
  for (var i = 0; i < events.length; ++i) {
    var task = events[i];

    if (task.active) {
      runTask(task);

      // Reschedule periodic repeating tasks
      // Check active again, since a task may have canceled itself
      if (task.period >= 0 && task.active) {
        task.time = task.time + task.period;
        insertByTime$1(task, tasks);
      }
    }
  }

  return tasks
}

function insertByTime$1 (task, timeslots) { // eslint-disable-line complexity
  var l = timeslots.length;

  if (l === 0) {
    timeslots.push(newTimeslot$1(task.time, [task]));
    return
  }

  var i = binarySearch$1(task.time, timeslots);

  if (i >= l) {
    timeslots.push(newTimeslot$1(task.time, [task]));
  } else if (task.time === timeslots[i].time) {
    timeslots[i].events.push(task);
  } else {
    timeslots.splice(i, 0, newTimeslot$1(task.time, [task]));
  }
}

function removeAllFrom$1 (f, timeslot) {
  timeslot.events = removeAll$1(f, timeslot.events);
}

function binarySearch$1 (t, sortedArray) { // eslint-disable-line complexity
  var lo = 0;
  var hi = sortedArray.length;
  var mid, y;

  while (lo < hi) {
    mid = Math.floor((lo + hi) / 2);
    y = sortedArray[mid];

    if (t === y.time) {
      return mid
    } else if (t < y.time) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return hi
}

function newTimeslot$1 (t, events) {
  return { time: t, events: events }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var defaultScheduler = new Scheduler$1(new ClockTimer$1(), new Timeline$1());

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function subscribe (subscriber, stream) {
  if (subscriber == null || typeof subscriber !== 'object') {
    throw new TypeError('subscriber must be an object')
  }

  var disposable = settable$1();
  var observer = new SubscribeObserver(fatalError$1, subscriber, disposable);

  disposable.setDisposable(stream.source.run(observer, defaultScheduler));

  return new Subscription(disposable)
}

function SubscribeObserver (fatalError, subscriber, disposable) {
  this.fatalError = fatalError;
  this.subscriber = subscriber;
  this.disposable = disposable;
}

SubscribeObserver.prototype.event = function (t, x) {
  if (!this.disposable.disposed && typeof this.subscriber.next === 'function') {
    this.subscriber.next(x);
  }
};

SubscribeObserver.prototype.end = function (t, x) {
  if (!this.disposable.disposed) {
    var s = this.subscriber;
    doDispose(this.fatalError, s, s.complete, s.error, this.disposable, x);
  }
};

SubscribeObserver.prototype.error = function (t, e) {
  var s = this.subscriber;
  doDispose(this.fatalError, s, s.error, s.error, this.disposable, e);
};

function Subscription (disposable) {
  this.disposable = disposable;
}

Subscription.prototype.unsubscribe = function () {
  this.disposable.dispose();
};

function doDispose (fatal, subscriber, complete, error, disposable, x) {
  Promise.resolve(disposable.dispose()).then(function () {
    if (typeof complete === 'function') {
      complete.call(subscriber, x);
    }
  }).catch(function (e) {
    if (typeof error === 'function') {
      error.call(subscriber, e);
    }
  }).catch(fatal);
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function thru (f, stream) {
  return f(stream)
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function tryEvent$3 (t, x, sink) {
  try {
    sink.event(t, x);
  } catch (e) {
    sink.error(t, e);
  }
}

function tryEnd$2 (t, x, sink) {
  try {
    sink.end(t, x);
  } catch (e) {
    sink.error(t, e);
  }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function EventTargetSource (event, source, capture) {
  this.event = event;
  this.source = source;
  this.capture = capture;
}

EventTargetSource.prototype.run = function (sink, scheduler) {
  function addEvent (e) {
    tryEvent$3(scheduler.now(), e, sink);
  }

  this.source.addEventListener(this.event, addEvent, this.capture);

  return create$1(disposeEventTarget,
    { target: this, addEvent: addEvent })
};

function disposeEventTarget (info) {
  var target = info.target;
  target.source.removeEventListener(target.event, info.addEvent, target.capture);
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function DeferredSink (sink) {
  this.sink = sink;
  this.events = [];
  this.active = true;
}

DeferredSink.prototype.event = function (t, x) {
  if (!this.active) {
    return
  }

  if (this.events.length === 0) {
    defer$1(new PropagateAllTask(this.sink, t, this.events));
  }

  this.events.push({ time: t, value: x });
};

DeferredSink.prototype.end = function (t, x) {
  if (!this.active) {
    return
  }

  this._end(new EndTask(t, x, this.sink));
};

DeferredSink.prototype.error = function (t, e) {
  this._end(new ErrorTask(t, e, this.sink));
};

DeferredSink.prototype._end = function (task) {
  this.active = false;
  defer$1(task);
};

function PropagateAllTask (sink, time, events) {
  this.sink = sink;
  this.events = events;
  this.time = time;
}

PropagateAllTask.prototype.run = function () {
  var this$1 = this;

  var events = this.events;
  var sink = this.sink;
  var event;

  for (var i = 0, l = events.length; i < l; ++i) {
    event = events[i];
    this$1.time = event.time;
    sink.event(event.time, event.value);
  }

  events.length = 0;
};

PropagateAllTask.prototype.error = function (e) {
  this.sink.error(this.time, e);
};

function EndTask (t, x, sink) {
  this.time = t;
  this.value = x;
  this.sink = sink;
}

EndTask.prototype.run = function () {
  this.sink.end(this.time, this.value);
};

EndTask.prototype.error = function (e) {
  this.sink.error(this.time, e);
};

function ErrorTask (t, e, sink) {
  this.time = t;
  this.value = e;
  this.sink = sink;
}

ErrorTask.prototype.run = function () {
  this.sink.error(this.time, this.value);
};

ErrorTask.prototype.error = function (e) {
  throw e
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function EventEmitterSource (event, source) {
  this.event = event;
  this.source = source;
}

EventEmitterSource.prototype.run = function (sink, scheduler) {
  // NOTE: Because EventEmitter allows events in the same call stack as
  // a listener is added, use a DeferredSink to buffer events
  // until the stack clears, then propagate.  This maintains most.js's
  // invariant that no event will be delivered in the same call stack
  // as an observer begins observing.
  var dsink = new DeferredSink(sink);

  function addEventVariadic (a) {
    var arguments$1 = arguments;

    var l = arguments.length;
    if (l > 1) {
      var arr = new Array(l);
      for (var i = 0; i < l; ++i) {
        arr[i] = arguments$1[i];
      }
      tryEvent$3(scheduler.now(), arr, dsink);
    } else {
      tryEvent$3(scheduler.now(), a, dsink);
    }
  }

  this.source.addListener(this.event, addEventVariadic);

  return create$1(disposeEventEmitter, { target: this, addEvent: addEventVariadic })
};

function disposeEventEmitter (info) {
  var target = info.target;
  target.source.removeListener(target.event, info.addEvent);
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Create a stream from an EventTarget, such as a DOM Node, or EventEmitter.
 * @param {String} event event type name, e.g. 'click'
 * @param {EventTarget|EventEmitter} source EventTarget or EventEmitter
 * @param {*?} capture for DOM events, whether to use
 *  capturing--passed as 3rd parameter to addEventListener.
 * @returns {Stream} stream containing all events of the specified type
 * from the source.
 */

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function withDefaultScheduler (source) {
  return withScheduler(source, defaultScheduler)
}

function withScheduler (source, scheduler) {
  return new Promise(function (resolve, reject) {
    runSource$1(source, scheduler, resolve, reject);
  })
}

function runSource$1 (source, scheduler, resolve, reject) {
  var disposable = settable$1();
  var observer = new Drain(resolve, reject, disposable);

  disposable.setDisposable(source.run(observer, scheduler));
}

function Drain (end, error, disposable) {
  this._end = end;
  this._error = error;
  this._disposable = disposable;
  this.active = true;
}

Drain.prototype.event = function (t, x) {};

Drain.prototype.end = function (t, x) {
  if (!this.active) {
    return
  }
  this.active = false;
  disposeThen$1(this._end, this._error, this._disposable, x);
};

Drain.prototype.error = function (t, e) {
  this.active = false;
  disposeThen$1(this._error, this._error, this._disposable, e);
};

function disposeThen$1 (end, error, disposable, x) {
  Promise.resolve(disposable.dispose()).then(function () {
    end(x);
  }, error);
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * A sink mixin that simply forwards event, end, and error to
 * another sink.
 * @param sink
 * @constructor
 */
function Pipe$1 (sink) {
  this.sink = sink;
}

Pipe$1.prototype.event = function (t, x) {
  return this.sink.event(t, x)
};

Pipe$1.prototype.end = function (t, x) {
  return this.sink.end(t, x)
};

Pipe$1.prototype.error = function (t, e) {
  return this.sink.error(t, e)
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Filter$1 (p, source) {
  this.p = p;
  this.source = source;
}

/**
 * Create a filtered source, fusing adjacent filter.filter if possible
 * @param {function(x:*):boolean} p filtering predicate
 * @param {{run:function}} source source to filter
 * @returns {Filter} filtered source
 */
Filter$1.create = function createFilter (p, source) {
  if (source instanceof Filter$1) {
    return new Filter$1(and$1(source.p, p), source.source)
  }

  return new Filter$1(p, source)
};

Filter$1.prototype.run = function (sink, scheduler) {
  return this.source.run(new FilterSink$1(this.p, sink), scheduler)
};

function FilterSink$1 (p, sink) {
  this.p = p;
  this.sink = sink;
}

FilterSink$1.prototype.end = Pipe$1.prototype.end;
FilterSink$1.prototype.error = Pipe$1.prototype.error;

FilterSink$1.prototype.event = function (t, x) {
  var p = this.p;
  p(x) && this.sink.event(t, x);
};

function and$1 (p, q) {
  return function (x) {
    return p(x) && q(x)
  }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function FilterMap$1 (p, f, source) {
  this.p = p;
  this.f = f;
  this.source = source;
}

FilterMap$1.prototype.run = function (sink, scheduler) {
  return this.source.run(new FilterMapSink$1(this.p, this.f, sink), scheduler)
};

function FilterMapSink$1 (p, f, sink) {
  this.p = p;
  this.f = f;
  this.sink = sink;
}

FilterMapSink$1.prototype.event = function (t, x) {
  var f = this.f;
  var p = this.p;
  p(x) && this.sink.event(t, f(x));
};

FilterMapSink$1.prototype.end = Pipe$1.prototype.end;
FilterMapSink$1.prototype.error = Pipe$1.prototype.error;

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Map$2 (f, source) {
  this.f = f;
  this.source = source;
}

/**
 * Create a mapped source, fusing adjacent map.map, filter.map,
 * and filter.map.map if possible
 * @param {function(*):*} f mapping function
 * @param {{run:function}} source source to map
 * @returns {Map|FilterMap} mapped source, possibly fused
 */
Map$2.create = function createMap (f, source) {
  if (source instanceof Map$2) {
    return new Map$2(compose$1(f, source.f), source.source)
  }

  if (source instanceof Filter$1) {
    return new FilterMap$1(source.p, f, source.source)
  }

  return new Map$2(f, source)
};

Map$2.prototype.run = function (sink, scheduler) { // eslint-disable-line no-extend-native
  return this.source.run(new MapSink$1(this.f, sink), scheduler)
};

function MapSink$1 (f, sink) {
  this.f = f;
  this.sink = sink;
}

MapSink$1.prototype.end = Pipe$1.prototype.end;
MapSink$1.prototype.error = Pipe$1.prototype.error;

MapSink$1.prototype.event = function (t, x) {
  var f = this.f;
  this.sink.event(t, f(x));
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @param {Stream} stream stream to map
 * @returns {Stream} stream containing items transformed by f
 */
function map$3$1 (f, stream) {
  return new Stream$1(Map$2.create(f, stream.source))
}

/**
* Replace each value in the stream with x
* @param {*} x
* @param {Stream} stream
* @returns {Stream} stream containing items replaced with x
*/
function constant (x, stream) {
  return map$3$1(function () {
    return x
  }, stream)
}

/**
* Perform a side effect for each item in the stream
* @param {function(x:*):*} f side effect to execute for each item. The
*  return value will be discarded.
* @param {Stream} stream stream to tap
* @returns {Stream} new stream containing the same items as this stream
*/
function tap (f, stream) {
  return new Stream$1(new Tap$1(f, stream.source))
}

function Tap$1 (f, source) {
  this.source = source;
  this.f = f;
}

Tap$1.prototype.run = function (sink, scheduler) {
  return this.source.run(new TapSink$1(this.f, sink), scheduler)
};

function TapSink$1 (f, sink) {
  this.sink = sink;
  this.f = f;
}

TapSink$1.prototype.end = Pipe$1.prototype.end;
TapSink$1.prototype.error = Pipe$1.prototype.error;

TapSink$1.prototype.event = function (t, x) {
  var f = this.f;
  f(x);
  this.sink.event(t, x);
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Observe all the event values in the stream in time order. The
 * provided function `f` will be called for each event value
 * @param {function(x:T):*} f function to call with each event value
 * @param {Stream<T>} stream stream to observe
 * @return {Promise} promise that fulfills after the stream ends without
 *  an error, or rejects if the stream ends with an error.
 */
function observe (f, stream) {
  return drain(tap(f, stream))
}

/**
 * "Run" a stream by creating demand and consuming all events
 * @param {Stream<T>} stream stream to drain
 * @return {Promise} promise that fulfills after the stream ends without
 *  an error, or rejects if the stream ends with an error.
 */
function drain (stream) {
  return withDefaultScheduler(stream.source)
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Generalized feedback loop. Call a stepper function for each event. The stepper
 * will be called with 2 params: the current seed and the an event value.  It must
 * return a new { seed, value } pair. The `seed` will be fed back into the next
 * invocation of stepper, and the `value` will be propagated as the event value.
 * @param {function(seed:*, value:*):{seed:*, value:*}} stepper loop step function
 * @param {*} seed initial seed value passed to first stepper call
 * @param {Stream} stream event stream
 * @returns {Stream} new stream whose values are the `value` field of the objects
 * returned by the stepper
 */
function loop (stepper, seed, stream) {
  return new Stream$1(new Loop$1(stepper, seed, stream.source))
}

function Loop$1 (stepper, seed, source) {
  this.step = stepper;
  this.seed = seed;
  this.source = source;
}

Loop$1.prototype.run = function (sink, scheduler) {
  return this.source.run(new LoopSink$1(this.step, this.seed, sink), scheduler)
};

function LoopSink$1 (stepper, seed, sink) {
  this.step = stepper;
  this.seed = seed;
  this.sink = sink;
}

LoopSink$1.prototype.error = Pipe$1.prototype.error;

LoopSink$1.prototype.event = function (t, x) {
  var result = this.step(this.seed, x);
  this.seed = result.seed;
  this.sink.event(t, result.value);
};

LoopSink$1.prototype.end = function (t) {
  this.sink.end(t, this.seed);
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Create a stream containing successive reduce results of applying f to
 * the previous reduce result and the current stream item.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial initial value
 * @param {Stream} stream stream to scan
 * @returns {Stream} new stream containing successive reduce results
 */
function scan (f, initial, stream) {
  return new Stream$1(new Scan$1(f, initial, stream.source))
}

function Scan$1 (f, z, source) {
  this.source = source;
  this.f = f;
  this.value = z;
}

Scan$1.prototype.run = function (sink, scheduler) {
  var d1 = scheduler.asap(PropagateTask$1.event(this.value, sink));
  var d2 = this.source.run(new ScanSink$1(this.f, this.value, sink), scheduler);
  return all$1([d1, d2])
};

function ScanSink$1 (f, z, sink) {
  this.f = f;
  this.value = z;
  this.sink = sink;
}

ScanSink$1.prototype.event = function (t, x) {
  var f = this.f;
  this.value = f(this.value, x);
  this.sink.event(t, this.value);
};

ScanSink$1.prototype.error = Pipe$1.prototype.error;
ScanSink$1.prototype.end = Pipe$1.prototype.end;

/**
* Reduce a stream to produce a single result.  Note that reducing an infinite
* stream will return a Promise that never fulfills, but that may reject if an error
* occurs.
* @param {function(result:*, x:*):*} f reducer function
* @param {*} initial initial value
* @param {Stream} stream to reduce
* @returns {Promise} promise for the file result of the reduce
*/
function reduce$2 (f, initial, stream) {
  return withDefaultScheduler(new Reduce(f, initial, stream.source))
}

function Reduce (f, z, source) {
  this.source = source;
  this.f = f;
  this.value = z;
}

Reduce.prototype.run = function (sink, scheduler) {
  return this.source.run(new ReduceSink(this.f, this.value, sink), scheduler)
};

function ReduceSink (f, z, sink) {
  this.f = f;
  this.value = z;
  this.sink = sink;
}

ReduceSink.prototype.event = function (t, x) {
  var f = this.f;
  this.value = f(this.value, x);
  this.sink.event(t, this.value);
};

ReduceSink.prototype.error = Pipe$1.prototype.error;

ReduceSink.prototype.end = function (t) {
  this.sink.end(t, this.value);
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Compute a stream by unfolding tuples of future values from a seed value
 * Event times may be controlled by returning a Promise from f
 * @param {function(seed:*):{value:*, seed:*, done:boolean}|Promise<{value:*, seed:*, done:boolean}>} f unfolding function accepts
 *  a seed and returns a new tuple with a value, new seed, and boolean done flag.
 *  If tuple.done is true, the stream will end.
 * @param {*} seed seed value
 * @returns {Stream} stream containing all value of all tuples produced by the
 *  unfolding function.
 */


function stepUnfold$1 (unfold, x) {
  var f = unfold.f;
  return Promise.resolve(f(x)).then(function (tuple) {
    return continueUnfold$1(unfold, tuple)
  })
}

function continueUnfold$1 (unfold, tuple) {
  if (tuple.done) {
    unfold.sink.end(unfold.scheduler.now(), tuple.value);
    return tuple.value
  }

  unfold.sink.event(unfold.scheduler.now(), tuple.value);

  if (!unfold.active) {
    return tuple.value
  }
  return stepUnfold$1(unfold, tuple.seed)
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Compute a stream by iteratively calling f to produce values
 * Event times may be controlled by returning a Promise from f
 * @param {function(x:*):*|Promise<*>} f
 * @param {*} x initial value
 * @returns {Stream}
 */


function stepIterate$1 (iterate, x) {
  iterate.sink.event(iterate.scheduler.now(), x);

  if (!iterate.active) {
    return x
  }

  var f = iterate.f;
  return Promise.resolve(f(x)).then(function (y) {
    return continueIterate$1(iterate, y)
  })
}

function continueIterate$1 (iterate, x) {
  return !iterate.active ? iterate.value : stepIterate$1(iterate, x)
}

/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Compute a stream using an *async* generator, which yields promises
 * to control event times.
 * @param f
 * @returns {Stream}
 */


function next$1 (generate, x) {
  return generate.active ? handle$1(generate, generate.iterator.next(x)) : x
}

function handle$1 (generate, result) {
  if (result.done) {
    return generate.sink.end(generate.scheduler.now(), result.value)
  }

  return Promise.resolve(result.value).then(function (x) {
    return emit$2(generate, x)
  }, function (e) {
    return error$4(generate, e)
  })
}

function emit$2 (generate, x) {
  generate.sink.event(generate.scheduler.now(), x);
  return next$1(generate, x)
}

function error$4 (generate, e) {
  return handle$1(generate, generate.iterator.throw(e))
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function continueWith (f, stream) {
  return new Stream$1(new ContinueWith$1(f, stream.source))
}

function ContinueWith$1 (f, source) {
  this.f = f;
  this.source = source;
}

ContinueWith$1.prototype.run = function (sink, scheduler) {
  return new ContinueWithSink$1(this.f, this.source, sink, scheduler)
};

function ContinueWithSink$1 (f, source, sink, scheduler) {
  this.f = f;
  this.sink = sink;
  this.scheduler = scheduler;
  this.active = true;
  this.disposable = once$1(source.run(this, scheduler));
}

ContinueWithSink$1.prototype.error = Pipe$1.prototype.error;

ContinueWithSink$1.prototype.event = function (t, x) {
  if (!this.active) {
    return
  }
  this.sink.event(t, x);
};

ContinueWithSink$1.prototype.end = function (t, x) {
  if (!this.active) {
    return
  }

  tryDispose$1(t, this.disposable, this.sink);
  this._startNext(t, x, this.sink);
};

ContinueWithSink$1.prototype._startNext = function (t, x, sink) {
  try {
    this.disposable = this._continue(this.f, x, sink);
  } catch (e) {
    sink.error(t, e);
  }
};

ContinueWithSink$1.prototype._continue = function (f, x, sink) {
  return f(x).source.run(sink, this.scheduler)
};

ContinueWithSink$1.prototype.dispose = function () {
  this.active = false;
  return this.disposable.dispose()
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * @param {*} x value to prepend
 * @param {Stream} stream
 * @returns {Stream} new stream with x prepended
 */
function cons$1 (x, stream) {
  return concat(of(x), stream)
}

/**
* @param {Stream} left
* @param {Stream} right
* @returns {Stream} new stream containing all events in left followed by all
*  events in right.  This *timeshifts* right to the end of left.
*/
function concat (left, right) {
  return continueWith(function () {
    return right
  }, left)
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function IndexSink$1 (i, sink) {
  this.sink = sink;
  this.index = i;
  this.active = true;
  this.value = void 0;
}

IndexSink$1.prototype.event = function (t, x) {
  if (!this.active) {
    return
  }
  this.value = x;
  this.sink.event(t, this);
};

IndexSink$1.prototype.end = function (t, x) {
  if (!this.active) {
    return
  }
  this.active = false;
  this.sink.end(t, { index: this.index, value: x });
};

IndexSink$1.prototype.error = Pipe$1.prototype.error;

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function invoke$1 (f, args) {
	/*eslint complexity: [2,7]*/
  switch (args.length) {
    case 0: return f()
    case 1: return f(args[0])
    case 2: return f(args[0], args[1])
    case 3: return f(args[0], args[1], args[2])
    case 4: return f(args[0], args[1], args[2], args[3])
    case 5: return f(args[0], args[1], args[2], args[3], args[4])
    default:
      return f.apply(void 0, args)
  }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var map$4$1 = map$1$1;
var tail$2$1 = tail$1$1;

/**
 * Combine latest events from all input streams
 * @param {function(...events):*} f function to combine most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */
function combine$1 (f /*, ...streams */) {
  return combineArray(f, tail$2$1(arguments))
}

/**
* Combine latest events from all input streams
* @param {function(...events):*} f function to combine most recent events
* @param {[Stream]} streams most recent events
* @returns {Stream} stream containing the result of applying f to the most recent
*  event of each input stream, whenever a new event arrives on any stream.
*/
function combineArray (f, streams) {
  var l = streams.length;
  return l === 0 ? empty$$1()
  : l === 1 ? map$3$1(f, streams[0])
  : new Stream$1(combineSources$1(f, streams))
}

function combineSources$1 (f, streams) {
  return new Combine$1(f, map$4$1(getSource$1$1, streams))
}

function getSource$1$1 (stream) {
  return stream.source
}

function Combine$1 (f, sources) {
  this.f = f;
  this.sources = sources;
}

Combine$1.prototype.run = function (sink, scheduler) {
  var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l);
  var sinks = new Array(l);

  var mergeSink = new CombineSink$1(disposables, sinks, sink, this.f);

  for (var indexSink, i = 0; i < l; ++i) {
    indexSink = sinks[i] = new IndexSink$1(i, mergeSink);
    disposables[i] = this$1.sources[i].run(indexSink, scheduler);
  }

  return all$1(disposables)
};

function CombineSink$1 (disposables, sinks, sink, f) {
  var this$1 = this;

  this.sink = sink;
  this.disposables = disposables;
  this.sinks = sinks;
  this.f = f;

  var l = sinks.length;
  this.awaiting = l;
  this.values = new Array(l);
  this.hasValue = new Array(l);
  for (var i = 0; i < l; ++i) {
    this$1.hasValue[i] = false;
  }

  this.activeCount = sinks.length;
}

CombineSink$1.prototype.error = Pipe$1.prototype.error;

CombineSink$1.prototype.event = function (t, indexedValue) {
  var i = indexedValue.index;
  var awaiting = this._updateReady(i);

  this.values[i] = indexedValue.value;
  if (awaiting === 0) {
    this.sink.event(t, invoke$1(this.f, this.values));
  }
};

CombineSink$1.prototype._updateReady = function (index) {
  if (this.awaiting > 0) {
    if (!this.hasValue[index]) {
      this.hasValue[index] = true;
      this.awaiting -= 1;
    }
  }
  return this.awaiting
};

CombineSink$1.prototype.end = function (t, indexedValue) {
  tryDispose$1(t, this.disposables[indexedValue.index], this.sink);
  if (--this.activeCount === 0) {
    this.sink.end(t, indexedValue.value);
  }
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Assume fs is a stream containing functions, and apply the latest function
 * in fs to the latest value in xs.
 * fs:         --f---------g--------h------>
 * xs:         -a-------b-------c-------d-->
 * ap(fs, xs): --fa-----fb-gb---gc--hc--hd->
 * @param {Stream} fs stream of functions to apply to the latest x
 * @param {Stream} xs stream of values to which to apply all the latest f
 * @returns {Stream} stream containing all the applications of fs to xs
 */
function ap (fs, xs) {
  return combine$1(apply$1, fs, xs)
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Transform a stream by passing its events through a transducer.
 * @param  {function} transducer transducer function
 * @param  {Stream} stream stream whose events will be passed through the
 *  transducer
 * @return {Stream} stream of events transformed by the transducer
 */
function transduce (transducer, stream) {
  return new Stream$1(new Transduce(transducer, stream.source))
}

function Transduce (transducer, source) {
  this.transducer = transducer;
  this.source = source;
}

Transduce.prototype.run = function (sink, scheduler) {
  var xf = this.transducer(new Transformer(sink));
  return this.source.run(new TransduceSink(getTxHandler(xf), sink), scheduler)
};

function TransduceSink (adapter, sink) {
  this.xf = adapter;
  this.sink = sink;
}

TransduceSink.prototype.event = function (t, x) {
  var next = this.xf.step(t, x);

  return this.xf.isReduced(next)
    ? this.sink.end(t, this.xf.getResult(next))
    : next
};

TransduceSink.prototype.end = function (t, x) {
  return this.xf.result(x)
};

TransduceSink.prototype.error = function (t, e) {
  return this.sink.error(t, e)
};

function Transformer (sink) {
  this.time = -Infinity;
  this.sink = sink;
}

Transformer.prototype['@@transducer/init'] = Transformer.prototype.init = function () {};

Transformer.prototype['@@transducer/step'] = Transformer.prototype.step = function (t, x) {
  if (!isNaN(t)) {
    this.time = Math.max(t, this.time);
  }
  return this.sink.event(this.time, x)
};

Transformer.prototype['@@transducer/result'] = Transformer.prototype.result = function (x) {
  return this.sink.end(this.time, x)
};

/**
* Given an object supporting the new or legacy transducer protocol,
* create an adapter for it.
* @param {object} tx transform
* @returns {TxAdapter|LegacyTxAdapter}
*/
function getTxHandler (tx) {
  return typeof tx['@@transducer/step'] === 'function'
    ? new TxAdapter(tx)
    : new LegacyTxAdapter(tx)
}

/**
* Adapter for new official transducer protocol
* @param {object} tx transform
* @constructor
*/
function TxAdapter (tx) {
  this.tx = tx;
}

TxAdapter.prototype.step = function (t, x) {
  return this.tx['@@transducer/step'](t, x)
};
TxAdapter.prototype.result = function (x) {
  return this.tx['@@transducer/result'](x)
};
TxAdapter.prototype.isReduced = function (x) {
  return x != null && x['@@transducer/reduced']
};
TxAdapter.prototype.getResult = function (x) {
  return x['@@transducer/value']
};

/**
* Adapter for older transducer protocol
* @param {object} tx transform
* @constructor
*/
function LegacyTxAdapter (tx) {
  this.tx = tx;
}

LegacyTxAdapter.prototype.step = function (t, x) {
  return this.tx.step(t, x)
};
LegacyTxAdapter.prototype.result = function (x) {
  return this.tx.result(x)
};
LegacyTxAdapter.prototype.isReduced = function (x) {
  return x != null && x.__transducers_reduced__
};
LegacyTxAdapter.prototype.getResult = function (x) {
  return x.value
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Doubly linked list
 * @constructor
 */
function LinkedList$1 () {
  this.head = null;
  this.length = 0;
}

/**
 * Add a node to the end of the list
 * @param {{prev:Object|null, next:Object|null, dispose:function}} x node to add
 */
LinkedList$1.prototype.add = function (x) {
  if (this.head !== null) {
    this.head.prev = x;
    x.next = this.head;
  }
  this.head = x;
  ++this.length;
};

/**
 * Remove the provided node from the list
 * @param {{prev:Object|null, next:Object|null, dispose:function}} x node to remove
 */
LinkedList$1.prototype.remove = function (x) { // eslint-disable-line  complexity
  --this.length;
  if (x === this.head) {
    this.head = this.head.next;
  }
  if (x.next !== null) {
    x.next.prev = x.prev;
    x.next = null;
  }
  if (x.prev !== null) {
    x.prev.next = x.next;
    x.prev = null;
  }
};

/**
 * @returns {boolean} true iff there are no nodes in the list
 */
LinkedList$1.prototype.isEmpty = function () {
  return this.length === 0
};

/**
 * Dispose all nodes
 * @returns {Promise} promise that fulfills when all nodes have been disposed,
 *  or rejects if an error occurs while disposing
 */
LinkedList$1.prototype.dispose = function () {
  if (this.isEmpty()) {
    return Promise.resolve()
  }

  var promises = [];
  var x = this.head;
  this.head = null;
  this.length = 0;

  while (x !== null) {
    promises.push(x.dispose());
    x = x.next;
  }

  return Promise.all(promises)
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function mergeConcurrently (concurrency, stream) {
  return mergeMapConcurrently(id$1, concurrency, stream)
}

function mergeMapConcurrently (f, concurrency, stream) {
  return new Stream$1(new MergeConcurrently$1(f, concurrency, stream.source))
}

function MergeConcurrently$1 (f, concurrency, source) {
  this.f = f;
  this.concurrency = concurrency;
  this.source = source;
}

MergeConcurrently$1.prototype.run = function (sink, scheduler) {
  return new Outer$1(this.f, this.concurrency, this.source, sink, scheduler)
};

function Outer$1 (f, concurrency, source, sink, scheduler) {
  this.f = f;
  this.concurrency = concurrency;
  this.sink = sink;
  this.scheduler = scheduler;
  this.pending = [];
  this.current = new LinkedList$1();
  this.disposable = once$1(source.run(this, scheduler));
  this.active = true;
}

Outer$1.prototype.event = function (t, x) {
  this._addInner(t, x);
};

Outer$1.prototype._addInner = function (t, x) {
  if (this.current.length < this.concurrency) {
    this._startInner(t, x);
  } else {
    this.pending.push(x);
  }
};

Outer$1.prototype._startInner = function (t, x) {
  try {
    this._initInner(t, x);
  } catch (e) {
    this.error(t, e);
  }
};

Outer$1.prototype._initInner = function (t, x) {
  var innerSink = new Inner$1(t, this, this.sink);
  innerSink.disposable = mapAndRun$1(this.f, x, innerSink, this.scheduler);
  this.current.add(innerSink);
};

function mapAndRun$1 (f, x, sink, scheduler) {
  return f(x).source.run(sink, scheduler)
}

Outer$1.prototype.end = function (t, x) {
  this.active = false;
  tryDispose$1(t, this.disposable, this.sink);
  this._checkEnd(t, x);
};

Outer$1.prototype.error = function (t, e) {
  this.active = false;
  this.sink.error(t, e);
};

Outer$1.prototype.dispose = function () {
  this.active = false;
  this.pending.length = 0;
  return Promise.all([this.disposable.dispose(), this.current.dispose()])
};

Outer$1.prototype._endInner = function (t, x, inner) {
  this.current.remove(inner);
  tryDispose$1(t, inner, this);

  if (this.pending.length === 0) {
    this._checkEnd(t, x);
  } else {
    this._startInner(t, this.pending.shift());
  }
};

Outer$1.prototype._checkEnd = function (t, x) {
  if (!this.active && this.current.isEmpty()) {
    this.sink.end(t, x);
  }
};

function Inner$1 (time, outer, sink) {
  this.prev = this.next = null;
  this.time = time;
  this.outer = outer;
  this.sink = sink;
  this.disposable = void 0;
}

Inner$1.prototype.event = function (t, x) {
  this.sink.event(Math.max(t, this.time), x);
};

Inner$1.prototype.end = function (t, x) {
  this.outer._endInner(Math.max(t, this.time), x, this);
};

Inner$1.prototype.error = function (t, e) {
  this.outer.error(Math.max(t, this.time), e);
};

Inner$1.prototype.dispose = function () {
  return this.disposable.dispose()
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Map each value in the stream to a new stream, and merge it into the
 * returned outer stream. Event arrival times are preserved.
 * @param {function(x:*):Stream} f chaining function, must return a Stream
 * @param {Stream} stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
function flatMap (f, stream) {
  return mergeMapConcurrently(f, Infinity, stream)
}

/**
 * Monadic join. Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer. Event arrival times are preserved.
 * @param {Stream<Stream<X>>} stream stream of streams
 * @returns {Stream<X>} new stream containing all events of all inner streams
 */
function join$1 (stream) {
  return mergeConcurrently(Infinity, stream)
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Map each value in stream to a new stream, and concatenate them all
 * stream:              -a---b---cX
 * f(a):                 1-1-1-1X
 * f(b):                        -2-2-2-2X
 * f(c):                                -3-3-3-3X
 * stream.concatMap(f): -1-1-1-1-2-2-2-2-3-3-3-3X
 * @param {function(x:*):Stream} f function to map each value to a stream
 * @param {Stream} stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
function concatMap (f, stream) {
  return mergeMapConcurrently(f, 1, stream)
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var reduce$3 = reduce$1$1;

/**
 * @returns {Stream} stream containing events from all streams in the argument
 * list in time order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */


/**
 * @param {Array} streams array of stream to merge
 * @returns {Stream} stream containing events from all input observables
 * in time order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */
function mergeArray$1 (streams) {
  var l = streams.length;
  return l === 0 ? empty$$1()
    : l === 1 ? streams[0]
    : new Stream$1(mergeSources$1(streams))
}

/**
 * This implements fusion/flattening for merge.  It will
 * fuse adjacent merge operations.  For example:
 * - a.merge(b).merge(c) effectively becomes merge(a, b, c)
 * - merge(a, merge(b, c)) effectively becomes merge(a, b, c)
 * It does this by concatenating the sources arrays of
 * any nested Merge sources, in effect "flattening" nested
 * merge operations into a single merge.
 */
function mergeSources$1 (streams) {
  return new Merge$1(reduce$3(appendSources$1, [], streams))
}

function appendSources$1 (sources, stream) {
  var source = stream.source;
  return source instanceof Merge$1
    ? sources.concat(source.sources)
    : sources.concat(source)
}

function Merge$1 (sources) {
  this.sources = sources;
}

Merge$1.prototype.run = function (sink, scheduler) {
  var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l);
  var sinks = new Array(l);

  var mergeSink = new MergeSink$1(disposables, sinks, sink);

  for (var indexSink, i = 0; i < l; ++i) {
    indexSink = sinks[i] = new IndexSink$1(i, mergeSink);
    disposables[i] = this$1.sources[i].run(indexSink, scheduler);
  }

  return all$1(disposables)
};

function MergeSink$1 (disposables, sinks, sink) {
  this.sink = sink;
  this.disposables = disposables;
  this.activeCount = sinks.length;
}

MergeSink$1.prototype.error = Pipe$1.prototype.error;

MergeSink$1.prototype.event = function (t, indexValue) {
  this.sink.event(t, indexValue.value);
};

MergeSink$1.prototype.end = function (t, indexedValue) {
  tryDispose$1(t, this.disposables[indexedValue.index], this.sink);
  if (--this.activeCount === 0) {
    this.sink.end(t, indexedValue.value);
  }
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * When an event arrives on sampler, emit the result of calling f with the latest
 * values of all streams being sampled
 * @param {function(...values):*} f function to apply to each set of sampled values
 * @param {Stream} sampler streams will be sampled whenever an event arrives
 *  on sampler
 * @returns {Stream} stream of sampled and transformed values
 */


/**
 * When an event arrives on sampler, emit the latest event value from stream.
 * @param {Stream} sampler stream of events at whose arrival time
 *  stream's latest value will be propagated
 * @param {Stream} stream stream of values
 * @returns {Stream} sampled stream of values
 */
function sampleWith (sampler, stream) {
  return new Stream$1(new Sampler(id$1, sampler.source, [stream.source]))
}

function sampleArray (f, sampler, streams) {
  return new Stream$1(new Sampler(f, sampler.source, map$1$1(getSource$2, streams)))
}

function getSource$2 (stream) {
  return stream.source
}

function Sampler (f, sampler, sources) {
  this.f = f;
  this.sampler = sampler;
  this.sources = sources;
}

Sampler.prototype.run = function (sink, scheduler) {
  var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l + 1);
  var sinks = new Array(l);

  var sampleSink = new SampleSink$1(this.f, sinks, sink);

  for (var hold, i = 0; i < l; ++i) {
    hold = sinks[i] = new Hold(sampleSink);
    disposables[i] = this$1.sources[i].run(hold, scheduler);
  }

  disposables[i] = this.sampler.run(sampleSink, scheduler);

  return all$1(disposables)
};

function Hold (sink) {
  this.sink = sink;
  this.hasValue = false;
}

Hold.prototype.event = function (t, x) {
  this.value = x;
  this.hasValue = true;
  this.sink._notify(this);
};

Hold.prototype.end = function () {};
Hold.prototype.error = Pipe$1.prototype.error;

function SampleSink$1 (f, sinks, sink) {
  this.f = f;
  this.sinks = sinks;
  this.sink = sink;
  this.active = false;
}

SampleSink$1.prototype._notify = function () {
  if (!this.active) {
    this.active = this.sinks.every(hasValue);
  }
};

SampleSink$1.prototype.event = function (t) {
  if (this.active) {
    this.sink.event(t, invoke$1(this.f, map$1$1(getValue, this.sinks)));
  }
};

SampleSink$1.prototype.end = Pipe$1.prototype.end;
SampleSink$1.prototype.error = Pipe$1.prototype.error;

function hasValue (hold) {
  return hold.hasValue
}

function getValue (hold) {
  return hold.value
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

// Based on https://github.com/petkaantonov/deque

function Queue$1 (capPow2) {
  this._capacity = capPow2 || 32;
  this._length = 0;
  this._head = 0;
}

Queue$1.prototype.push = function (x) {
  var len = this._length;
  this._checkCapacity(len + 1);

  var i = (this._head + len) & (this._capacity - 1);
  this[i] = x;
  this._length = len + 1;
};

Queue$1.prototype.shift = function () {
  var head = this._head;
  var x = this[head];

  this[head] = void 0;
  this._head = (head + 1) & (this._capacity - 1);
  this._length--;
  return x
};

Queue$1.prototype.isEmpty = function () {
  return this._length === 0
};

Queue$1.prototype.length = function () {
  return this._length
};

Queue$1.prototype._checkCapacity = function (size) {
  if (this._capacity < size) {
    this._ensureCapacity(this._capacity << 1);
  }
};

Queue$1.prototype._ensureCapacity = function (capacity) {
  var oldCapacity = this._capacity;
  this._capacity = capacity;

  var last = this._head + this._length;

  if (last > oldCapacity) {
    copy$3(this, 0, this, oldCapacity, last & (oldCapacity - 1));
  }
};

function copy$3 (src, srcIndex, dst, dstIndex, len) {
  for (var j = 0; j < len; ++j) {
    dst[j + dstIndex] = src[j + srcIndex];
    src[j + srcIndex] = void 0;
  }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var map$5 = map$1$1;
/**
 * Combine streams pairwise (or tuple-wise) by index by applying f to values
 * at corresponding indices.  The returned stream ends when any of the input
 * streams ends.
 * @param {function} f function to combine values
 * @returns {Stream} new stream with items at corresponding indices combined
 *  using f
 */


/**
* Combine streams pairwise (or tuple-wise) by index by applying f to values
* at corresponding indices.  The returned stream ends when any of the input
* streams ends.
* @param {function} f function to combine values
* @param {[Stream]} streams streams to zip using f
* @returns {Stream} new stream with items at corresponding indices combined
*  using f
*/
function zipArray (f, streams) {
  return streams.length === 0 ? empty$$1()
: streams.length === 1 ? map$3$1(f, streams[0])
: new Stream$1(new Zip$1(f, map$5(getSource$3, streams)))
}

function getSource$3 (stream) {
  return stream.source
}

function Zip$1 (f, sources) {
  this.f = f;
  this.sources = sources;
}

Zip$1.prototype.run = function (sink, scheduler) {
  var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l);
  var sinks = new Array(l);
  var buffers = new Array(l);

  var zipSink = new ZipSink$1(this.f, buffers, sinks, sink);

  for (var indexSink, i = 0; i < l; ++i) {
    buffers[i] = new Queue$1();
    indexSink = sinks[i] = new IndexSink$1(i, zipSink);
    disposables[i] = this$1.sources[i].run(indexSink, scheduler);
  }

  return all$1(disposables)
};

function ZipSink$1 (f, buffers, sinks, sink) {
  this.f = f;
  this.sinks = sinks;
  this.sink = sink;
  this.buffers = buffers;
}

ZipSink$1.prototype.event = function (t, indexedValue) { // eslint-disable-line complexity
  var buffers = this.buffers;
  var buffer = buffers[indexedValue.index];

  buffer.push(indexedValue.value);

  if (buffer.length() === 1) {
    if (!ready$1(this.buffers)) {
      return
    }

    emitZipped$1(this.f, t, buffers, this.sink);

    if (ended$1(this.buffers, this.sinks)) {
      this.sink.end(t, void 0);
    }
  }
};

ZipSink$1.prototype.end = function (t, indexedValue) {
  var buffer = this.buffers[indexedValue.index];
  if (buffer.isEmpty()) {
    this.sink.end(t, indexedValue.value);
  }
};

ZipSink$1.prototype.error = Pipe$1.prototype.error;

function emitZipped$1 (f, t, buffers, sink) {
  sink.event(t, invoke$1(f, map$5(head$1, buffers)));
}

function head$1 (buffer) {
  return buffer.shift()
}

function ended$1 (buffers, sinks) {
  for (var i = 0, l = buffers.length; i < l; ++i) {
    if (buffers[i].isEmpty() && !sinks[i].active) {
      return true
    }
  }
  return false
}

function ready$1 (buffers) {
  for (var i = 0, l = buffers.length; i < l; ++i) {
    if (buffers[i].isEmpty()) {
      return false
    }
  }
  return true
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Given a stream of streams, return a new stream that adopts the behavior
 * of the most recent inner stream.
 * @param {Stream} stream of streams on which to switch
 * @returns {Stream} switching stream
 */
function switchLatest$1 (stream) {
  return new Stream$1(new Switch$1(stream.source))
}

function Switch$1 (source) {
  this.source = source;
}

Switch$1.prototype.run = function (sink, scheduler) {
  var switchSink = new SwitchSink$1(sink, scheduler);
  return all$1([switchSink, this.source.run(switchSink, scheduler)])
};

function SwitchSink$1 (sink, scheduler) {
  this.sink = sink;
  this.scheduler = scheduler;
  this.current = null;
  this.ended = false;
}

SwitchSink$1.prototype.event = function (t, stream) {
  this._disposeCurrent(t); // TODO: capture the result of this dispose
  this.current = new Segment$1(t, Infinity, this, this.sink);
  this.current.disposable = stream.source.run(this.current, this.scheduler);
};

SwitchSink$1.prototype.end = function (t, x) {
  this.ended = true;
  this._checkEnd(t, x);
};

SwitchSink$1.prototype.error = function (t, e) {
  this.ended = true;
  this.sink.error(t, e);
};

SwitchSink$1.prototype.dispose = function () {
  return this._disposeCurrent(this.scheduler.now())
};

SwitchSink$1.prototype._disposeCurrent = function (t) {
  if (this.current !== null) {
    return this.current._dispose(t)
  }
};

SwitchSink$1.prototype._disposeInner = function (t, inner) {
  inner._dispose(t); // TODO: capture the result of this dispose
  if (inner === this.current) {
    this.current = null;
  }
};

SwitchSink$1.prototype._checkEnd = function (t, x) {
  if (this.ended && this.current === null) {
    this.sink.end(t, x);
  }
};

SwitchSink$1.prototype._endInner = function (t, x, inner) {
  this._disposeInner(t, inner);
  this._checkEnd(t, x);
};

SwitchSink$1.prototype._errorInner = function (t, e, inner) {
  this._disposeInner(t, inner);
  this.sink.error(t, e);
};

function Segment$1 (min, max, outer, sink) {
  this.min = min;
  this.max = max;
  this.outer = outer;
  this.sink = sink;
  this.disposable = empty$1$1();
}

Segment$1.prototype.event = function (t, x) {
  if (t < this.max) {
    this.sink.event(Math.max(t, this.min), x);
  }
};

Segment$1.prototype.end = function (t, x) {
  this.outer._endInner(Math.max(t, this.min), x, this);
};

Segment$1.prototype.error = function (t, e) {
  this.outer._errorInner(Math.max(t, this.min), e, this);
};

Segment$1.prototype._dispose = function (t) {
  this.max = t;
  tryDispose$1(t, this.disposable, this.sink);
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Retain only items matching a predicate
 * @param {function(x:*):boolean} p filtering predicate called for each item
 * @param {Stream} stream stream to filter
 * @returns {Stream} stream containing only items for which predicate returns truthy
 */
function filter (p, stream) {
  return new Stream$1(Filter$1.create(p, stream.source))
}

/**
 * Skip repeated events, using === to detect duplicates
 * @param {Stream} stream stream from which to omit repeated events
 * @returns {Stream} stream without repeated events
 */
function skipRepeats$1 (stream) {
  return skipRepeatsWith(same$1, stream)
}

/**
 * Skip repeated events using the provided equals function to detect duplicates
 * @param {function(a:*, b:*):boolean} equals optional function to compare items
 * @param {Stream} stream stream from which to omit repeated events
 * @returns {Stream} stream without repeated events
 */
function skipRepeatsWith (equals, stream) {
  return new Stream$1(new SkipRepeats$1(equals, stream.source))
}

function SkipRepeats$1 (equals, source) {
  this.equals = equals;
  this.source = source;
}

SkipRepeats$1.prototype.run = function (sink, scheduler) {
  return this.source.run(new SkipRepeatsSink$1(this.equals, sink), scheduler)
};

function SkipRepeatsSink$1 (equals, sink) {
  this.equals = equals;
  this.sink = sink;
  this.value = void 0;
  this.init = true;
}

SkipRepeatsSink$1.prototype.end = Pipe$1.prototype.end;
SkipRepeatsSink$1.prototype.error = Pipe$1.prototype.error;

SkipRepeatsSink$1.prototype.event = function (t, x) {
  if (this.init) {
    this.init = false;
    this.value = x;
    this.sink.event(t, x);
  } else if (!this.equals(this.value, x)) {
    this.value = x;
    this.sink.event(t, x);
  }
};

function same$1 (a, b) {
  return a === b
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * @param {number} n
 * @param {Stream} stream
 * @returns {Stream} new stream containing only up to the first n items from stream
 */
function take (n, stream) {
  return slice(0, n, stream)
}

/**
 * @param {number} n
 * @param {Stream} stream
 * @returns {Stream} new stream with the first n items removed
 */
function skip (n, stream) {
  return slice(n, Infinity, stream)
}

/**
 * Slice a stream by index. Negative start/end indexes are not supported
 * @param {number} start
 * @param {number} end
 * @param {Stream} stream
 * @returns {Stream} stream containing items where start <= index < end
 */
function slice (start, end, stream) {
  return end <= start ? empty$$1()
    : new Stream$1(sliceSource$1(start, end, stream.source))
}

function sliceSource$1 (start, end, source) {
  return source instanceof Map$2 ? commuteMapSlice$1(start, end, source)
    : source instanceof Slice$1 ? fuseSlice$1(start, end, source)
    : new Slice$1(start, end, source)
}

function commuteMapSlice$1 (start, end, source) {
  return Map$2.create(source.f, sliceSource$1(start, end, source.source))
}

function fuseSlice$1 (start, end, source) {
  start += source.min;
  end = Math.min(end + source.min, source.max);
  return new Slice$1(start, end, source.source)
}

function Slice$1 (min, max, source) {
  this.source = source;
  this.min = min;
  this.max = max;
}

Slice$1.prototype.run = function (sink, scheduler) {
  return new SliceSink$1(this.min, this.max - this.min, this.source, sink, scheduler)
};

function SliceSink$1 (skip, take, source, sink, scheduler) {
  this.sink = sink;
  this.skip = skip;
  this.take = take;
  this.disposable = once$1(source.run(this, scheduler));
}

SliceSink$1.prototype.end = Pipe$1.prototype.end;
SliceSink$1.prototype.error = Pipe$1.prototype.error;

SliceSink$1.prototype.event = function (t, x) { // eslint-disable-line complexity
  if (this.skip > 0) {
    this.skip -= 1;
    return
  }

  if (this.take === 0) {
    return
  }

  this.take -= 1;
  this.sink.event(t, x);
  if (this.take === 0) {
    this.dispose();
    this.sink.end(t, x);
  }
};

SliceSink$1.prototype.dispose = function () {
  return this.disposable.dispose()
};

function takeWhile (p, stream) {
  return new Stream$1(new TakeWhile$1(p, stream.source))
}

function TakeWhile$1 (p, source) {
  this.p = p;
  this.source = source;
}

TakeWhile$1.prototype.run = function (sink, scheduler) {
  return new TakeWhileSink$1(this.p, this.source, sink, scheduler)
};

function TakeWhileSink$1 (p, source, sink, scheduler) {
  this.p = p;
  this.sink = sink;
  this.active = true;
  this.disposable = once$1(source.run(this, scheduler));
}

TakeWhileSink$1.prototype.end = Pipe$1.prototype.end;
TakeWhileSink$1.prototype.error = Pipe$1.prototype.error;

TakeWhileSink$1.prototype.event = function (t, x) {
  if (!this.active) {
    return
  }

  var p = this.p;
  this.active = p(x);
  if (this.active) {
    this.sink.event(t, x);
  } else {
    this.dispose();
    this.sink.end(t, x);
  }
};

TakeWhileSink$1.prototype.dispose = function () {
  return this.disposable.dispose()
};

function skipWhile (p, stream) {
  return new Stream$1(new SkipWhile$1(p, stream.source))
}

function SkipWhile$1 (p, source) {
  this.p = p;
  this.source = source;
}

SkipWhile$1.prototype.run = function (sink, scheduler) {
  return this.source.run(new SkipWhileSink$1(this.p, sink), scheduler)
};

function SkipWhileSink$1 (p, sink) {
  this.p = p;
  this.sink = sink;
  this.skipping = true;
}

SkipWhileSink$1.prototype.end = Pipe$1.prototype.end;
SkipWhileSink$1.prototype.error = Pipe$1.prototype.error;

SkipWhileSink$1.prototype.event = function (t, x) {
  if (this.skipping) {
    var p = this.p;
    this.skipping = p(x);
    if (this.skipping) {
      return
    }
  }

  this.sink.event(t, x);
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function takeUntil$1 (signal, stream) {
  return new Stream$1(new Until$1(signal.source, stream.source))
}

function skipUntil$1 (signal, stream) {
  return new Stream$1(new Since$1(signal.source, stream.source))
}

function during (timeWindow, stream) {
  return takeUntil$1(join$1(timeWindow), skipUntil$1(timeWindow, stream))
}

function Until$1 (maxSignal, source) {
  this.maxSignal = maxSignal;
  this.source = source;
}

Until$1.prototype.run = function (sink, scheduler) {
  var min = new Bound$1(-Infinity, sink);
  var max = new UpperBound$1(this.maxSignal, sink, scheduler);
  var disposable = this.source.run(new TimeWindowSink$1(min, max, sink), scheduler);

  return all$1([min, max, disposable])
};

function Since$1 (minSignal, source) {
  this.minSignal = minSignal;
  this.source = source;
}

Since$1.prototype.run = function (sink, scheduler) {
  var min = new LowerBound$1(this.minSignal, sink, scheduler);
  var max = new Bound$1(Infinity, sink);
  var disposable = this.source.run(new TimeWindowSink$1(min, max, sink), scheduler);

  return all$1([min, max, disposable])
};

function Bound$1 (value, sink) {
  this.value = value;
  this.sink = sink;
}

Bound$1.prototype.error = Pipe$1.prototype.error;
Bound$1.prototype.event = noop$1;
Bound$1.prototype.end = noop$1;
Bound$1.prototype.dispose = noop$1;

function TimeWindowSink$1 (min, max, sink) {
  this.min = min;
  this.max = max;
  this.sink = sink;
}

TimeWindowSink$1.prototype.event = function (t, x) {
  if (t >= this.min.value && t < this.max.value) {
    this.sink.event(t, x);
  }
};

TimeWindowSink$1.prototype.error = Pipe$1.prototype.error;
TimeWindowSink$1.prototype.end = Pipe$1.prototype.end;

function LowerBound$1 (signal, sink, scheduler) {
  this.value = Infinity;
  this.sink = sink;
  this.disposable = signal.run(this, scheduler);
}

LowerBound$1.prototype.event = function (t /*, x */) {
  if (t < this.value) {
    this.value = t;
  }
};

LowerBound$1.prototype.end = noop$1;
LowerBound$1.prototype.error = Pipe$1.prototype.error;

LowerBound$1.prototype.dispose = function () {
  return this.disposable.dispose()
};

function UpperBound$1 (signal, sink, scheduler) {
  this.value = Infinity;
  this.sink = sink;
  this.disposable = signal.run(this, scheduler);
}

UpperBound$1.prototype.event = function (t, x) {
  if (t < this.value) {
    this.value = t;
    this.sink.end(t, x);
  }
};

UpperBound$1.prototype.end = noop$1;
UpperBound$1.prototype.error = Pipe$1.prototype.error;

UpperBound$1.prototype.dispose = function () {
  return this.disposable.dispose()
};

function noop$1 () {}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * @param {Number} delayTime milliseconds to delay each item
 * @param {Stream} stream
 * @returns {Stream} new stream containing the same items, but delayed by ms
 */
function delay$1$1 (delayTime, stream) {
  return delayTime <= 0 ? stream
    : new Stream$1(new Delay$1(delayTime, stream.source))
}

function Delay$1 (dt, source) {
  this.dt = dt;
  this.source = source;
}

Delay$1.prototype.run = function (sink, scheduler) {
  var delaySink = new DelaySink$1(this.dt, sink, scheduler);
  return all$1([delaySink, this.source.run(delaySink, scheduler)])
};

function DelaySink$1 (dt, sink, scheduler) {
  this.dt = dt;
  this.sink = sink;
  this.scheduler = scheduler;
}

DelaySink$1.prototype.dispose = function () {
  var self = this;
  this.scheduler.cancelAll(function (task) {
    return task.sink === self.sink
  });
};

DelaySink$1.prototype.event = function (t, x) {
  this.scheduler.delay(this.dt, PropagateTask$1.event(x, this.sink));
};

DelaySink$1.prototype.end = function (t, x) {
  this.scheduler.delay(this.dt, PropagateTask$1.end(x, this.sink));
};

DelaySink$1.prototype.error = Pipe$1.prototype.error;

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function timestamp (stream) {
  return new Stream$1(new Timestamp(stream.source))
}

function Timestamp (source) {
  this.source = source;
}

Timestamp.prototype.run = function (sink, scheduler) {
  return this.source.run(new TimestampSink(sink), scheduler)
};

function TimestampSink (sink) {
  this.sink = sink;
}

TimestampSink.prototype.end = Pipe$1.prototype.end;
TimestampSink.prototype.error = Pipe$1.prototype.error;

TimestampSink.prototype.event = function (t, x) {
  this.sink.event(t, { time: t, value: x });
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Limit the rate of events by suppressing events that occur too often
 * @param {Number} period time to suppress events
 * @param {Stream} stream
 * @returns {Stream}
 */
function throttle (period, stream) {
  return new Stream$1(throttleSource$1(period, stream.source))
}

function throttleSource$1 (period, source) {
  return source instanceof Map$2 ? commuteMapThrottle$1(period, source)
    : source instanceof Throttle$1 ? fuseThrottle$1(period, source)
    : new Throttle$1(period, source)
}

function commuteMapThrottle$1 (period, source) {
  return Map$2.create(source.f, throttleSource$1(period, source.source))
}

function fuseThrottle$1 (period, source) {
  return new Throttle$1(Math.max(period, source.period), source.source)
}

function Throttle$1 (period, source) {
  this.period = period;
  this.source = source;
}

Throttle$1.prototype.run = function (sink, scheduler) {
  return this.source.run(new ThrottleSink$1(this.period, sink), scheduler)
};

function ThrottleSink$1 (period, sink) {
  this.time = 0;
  this.period = period;
  this.sink = sink;
}

ThrottleSink$1.prototype.event = function (t, x) {
  if (t >= this.time) {
    this.time = t + this.period;
    this.sink.event(t, x);
  }
};

ThrottleSink$1.prototype.end = Pipe$1.prototype.end;

ThrottleSink$1.prototype.error = Pipe$1.prototype.error;

/**
 * Wait for a burst of events to subside and emit only the last event in the burst
 * @param {Number} period events occuring more frequently than this
 *  will be suppressed
 * @param {Stream} stream stream to debounce
 * @returns {Stream} new debounced stream
 */
function debounce (period, stream) {
  return new Stream$1(new Debounce$1(period, stream.source))
}

function Debounce$1 (dt, source) {
  this.dt = dt;
  this.source = source;
}

Debounce$1.prototype.run = function (sink, scheduler) {
  return new DebounceSink$1(this.dt, this.source, sink, scheduler)
};

function DebounceSink$1 (dt, source, sink, scheduler) {
  this.dt = dt;
  this.sink = sink;
  this.scheduler = scheduler;
  this.value = void 0;
  this.timer = null;

  var sourceDisposable = source.run(this, scheduler);
  this.disposable = all$1([this, sourceDisposable]);
}

DebounceSink$1.prototype.event = function (t, x) {
  this._clearTimer();
  this.value = x;
  this.timer = this.scheduler.delay(this.dt, PropagateTask$1.event(x, this.sink));
};

DebounceSink$1.prototype.end = function (t, x) {
  if (this._clearTimer()) {
    this.sink.event(t, this.value);
    this.value = void 0;
  }
  this.sink.end(t, x);
};

DebounceSink$1.prototype.error = function (t, x) {
  this._clearTimer();
  this.sink.error(t, x);
};

DebounceSink$1.prototype.dispose = function () {
  this._clearTimer();
};

DebounceSink$1.prototype._clearTimer = function () {
  if (this.timer === null) {
    return false
  }
  this.timer.dispose();
  this.timer = null;
  return true
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Create a stream containing only the promise's fulfillment
 * value at the time it fulfills.
 * @param {Promise<T>} p promise
 * @return {Stream<T>} stream containing promise's fulfillment value.
 *  If the promise rejects, the stream will error
 */


/**
 * Turn a Stream<Promise<T>> into Stream<T> by awaiting each promise.
 * Event order is preserved.
 * @param {Stream<Promise<T>>} stream
 * @return {Stream<T>} stream of fulfillment values.  The stream will
 * error if any promise rejects.
 */
function awaitPromises$1 (stream) {
  return new Stream$1(new Await$1(stream.source))
}

function Await$1 (source) {
  this.source = source;
}

Await$1.prototype.run = function (sink, scheduler) {
  return this.source.run(new AwaitSink$1(sink, scheduler), scheduler)
};

function AwaitSink$1 (sink, scheduler) {
  this.sink = sink;
  this.scheduler = scheduler;
  this.queue = Promise.resolve();
  var self = this;

	// Pre-create closures, to avoid creating them per event
  this._eventBound = function (x) {
    self.sink.event(self.scheduler.now(), x);
  };

  this._endBound = function (x) {
    self.sink.end(self.scheduler.now(), x);
  };

  this._errorBound = function (e) {
    self.sink.error(self.scheduler.now(), e);
  };
}

AwaitSink$1.prototype.event = function (t, promise) {
  var self = this;
  this.queue = this.queue.then(function () {
    return self._event(promise)
  }).catch(this._errorBound);
};

AwaitSink$1.prototype.end = function (t, x) {
  var self = this;
  this.queue = this.queue.then(function () {
    return self._end(x)
  }).catch(this._errorBound);
};

AwaitSink$1.prototype.error = function (t, e) {
  var self = this;
  // Don't resolve error values, propagate directly
  this.queue = this.queue.then(function () {
    return self._errorBound(e)
  }).catch(fatalError$1);
};

AwaitSink$1.prototype._event = function (promise) {
  return promise.then(this._eventBound)
};

AwaitSink$1.prototype._end = function (x) {
  return Promise.resolve(x).then(this._endBound)
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function SafeSink$1 (sink) {
  this.sink = sink;
  this.active = true;
}

SafeSink$1.prototype.event = function (t, x) {
  if (!this.active) {
    return
  }
  this.sink.event(t, x);
};

SafeSink$1.prototype.end = function (t, x) {
  if (!this.active) {
    return
  }
  this.disable();
  this.sink.end(t, x);
};

SafeSink$1.prototype.error = function (t, e) {
  this.disable();
  this.sink.error(t, e);
};

SafeSink$1.prototype.disable = function () {
  this.active = false;
  return this.sink
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * If stream encounters an error, recover and continue with items from stream
 * returned by f.
 * @param {function(error:*):Stream} f function which returns a new stream
 * @param {Stream} stream
 * @returns {Stream} new stream which will recover from an error by calling f
 */
function recoverWith (f, stream) {
  return new Stream$1(new RecoverWith$1(f, stream.source))
}

var flatMapError = recoverWith;

/**
 * Create a stream containing only an error
 * @param {*} e error value, preferably an Error or Error subtype
 * @returns {Stream} new stream containing only an error
 */


function RecoverWith$1 (f, source) {
  this.f = f;
  this.source = source;
}

RecoverWith$1.prototype.run = function (sink, scheduler) {
  return new RecoverWithSink$1(this.f, this.source, sink, scheduler)
};

function RecoverWithSink$1 (f, source, sink, scheduler) {
  this.f = f;
  this.sink = new SafeSink$1(sink);
  this.scheduler = scheduler;
  this.disposable = source.run(this, scheduler);
}

RecoverWithSink$1.prototype.event = function (t, x) {
  tryEvent$3(t, x, this.sink);
};

RecoverWithSink$1.prototype.end = function (t, x) {
  tryEnd$2(t, x, this.sink);
};

RecoverWithSink$1.prototype.error = function (t, e) {
  var nextSink = this.sink.disable();

  tryDispose$1(t, this.disposable, this.sink);
  this._startNext(t, e, nextSink);
};

RecoverWithSink$1.prototype._startNext = function (t, x, sink) {
  try {
    this.disposable = this._continue(this.f, x, sink);
  } catch (e) {
    sink.error(t, e);
  }
};

RecoverWithSink$1.prototype._continue = function (f, x, sink) {
  var stream = f(x);
  return stream.source.run(sink, this.scheduler)
};

RecoverWithSink$1.prototype.dispose = function () {
  return this.disposable.dispose()
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

// Add of and empty to constructor for fantasy-land compat
Stream$1.of = of;
Stream$1.empty = empty$$1;
// Add from to constructor for ES Observable compat
Stream$1.from = from;
// -----------------------------------------------------------------------
// Draft ES Observable proposal interop
// https://github.com/zenparsing/es-observable

Stream$1.prototype.subscribe = function (subscriber) {
  return subscribe(subscriber, this)
};

Stream$1.prototype[result] = function () {
  return this
};

// -----------------------------------------------------------------------
// Fluent adapter

/**
 * Adapt a functional stream transform to fluent style.
 * It applies f to the this stream object
 * @param  {function(s: Stream): Stream} f function that
 * receives the stream itself and must return a new stream
 * @return {Stream}
 */
Stream$1.prototype.thru = function (f) {
  return thru(f, this)
};

// -----------------------------------------------------------------------
// Observing

/**
 * Process all the events in the stream
 * @returns {Promise} promise that fulfills when the stream ends, or rejects
 *  if the stream fails with an unhandled error.
 */
Stream$1.prototype.observe = Stream$1.prototype.forEach = function (f) {
  return observe(f, this)
};

/**
 * Consume all events in the stream, without providing a function to process each.
 * This causes a stream to become active and begin emitting events, and is useful
 * in cases where all processing has been setup upstream via other combinators, and
 * there is no need to process the terminal events.
 * @returns {Promise} promise that fulfills when the stream ends, or rejects
 *  if the stream fails with an unhandled error.
 */
Stream$1.prototype.drain = function () {
  return drain(this)
};

// -------------------------------------------------------

/**
 * Generalized feedback loop. Call a stepper function for each event. The stepper
 * will be called with 2 params: the current seed and the an event value.  It must
 * return a new { seed, value } pair. The `seed` will be fed back into the next
 * invocation of stepper, and the `value` will be propagated as the event value.
 * @param {function(seed:*, value:*):{seed:*, value:*}} stepper loop step function
 * @param {*} seed initial seed value passed to first stepper call
 * @returns {Stream} new stream whose values are the `value` field of the objects
 * returned by the stepper
 */
Stream$1.prototype.loop = function (stepper, seed) {
  return loop(stepper, seed, this)
};

// -------------------------------------------------------

/**
 * Create a stream containing successive reduce results of applying f to
 * the previous reduce result and the current stream item.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial initial value
 * @returns {Stream} new stream containing successive reduce results
 */
Stream$1.prototype.scan = function (f, initial) {
  return scan(f, initial, this)
};

/**
 * Reduce the stream to produce a single result.  Note that reducing an infinite
 * stream will return a Promise that never fulfills, but that may reject if an error
 * occurs.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial optional initial value
 * @returns {Promise} promise for the file result of the reduce
 */
Stream$1.prototype.reduce = function (f, initial) {
  return reduce$2(f, initial, this)
};

/**
 * @param {Stream} tail
 * @returns {Stream} new stream containing all items in this followed by
 *  all items in tail
 */
Stream$1.prototype.concat = function (tail$$1) {
  return concat(this, tail$$1)
};

/**
 * @param {*} x value to prepend
 * @returns {Stream} a new stream with x prepended
 */
Stream$1.prototype.startWith = function (x) {
  return cons$1(x, this)
};

// -----------------------------------------------------------------------
// Transforming

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @returns {Stream} stream containing items transformed by f
 */
Stream$1.prototype.map = function (f) {
  return map$3$1(f, this)
};

/**
 * Assume this stream contains functions, and apply each function to each item
 * in the provided stream.  This generates, in effect, a cross product.
 * @param {Stream} xs stream of items to which
 * @returns {Stream} stream containing the cross product of items
 */
Stream$1.prototype.ap = function (xs) {
  return ap(this, xs)
};

/**
 * Replace each value in the stream with x
 * @param {*} x
 * @returns {Stream} stream containing items replaced with x
 */
Stream$1.prototype.constant = function (x) {
  return constant(x, this)
};

/**
 * Perform a side effect for each item in the stream
 * @param {function(x:*):*} f side effect to execute for each item. The
 *  return value will be discarded.
 * @returns {Stream} new stream containing the same items as this stream
 */
Stream$1.prototype.tap = function (f) {
  return tap(f, this)
};

// -----------------------------------------------------------------------
// Transducer support

/**
 * Transform this stream by passing its events through a transducer.
 * @param  {function} transducer transducer function
 * @return {Stream} stream of events transformed by the transducer
 */
Stream$1.prototype.transduce = function (transducer) {
  return transduce(transducer, this)
};

// -----------------------------------------------------------------------
// FlatMapping

/**
 * Map each value in the stream to a new stream, and merge it into the
 * returned outer stream. Event arrival times are preserved.
 * @param {function(x:*):Stream} f chaining function, must return a Stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
Stream$1.prototype.chain = function (f) {
  return flatMap(f, this)
};

// @deprecated use chain instead
Stream$1.prototype.flatMap = Stream$1.prototype.chain;

  /**
 * Monadic join. Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer. Event arrival times are preserved.
 * @returns {Stream<X>} new stream containing all events of all inner streams
 */
Stream$1.prototype.join = function () {
  return join$1(this)
};

/**
 * Map the end event to a new stream, and begin emitting its values.
 * @param {function(x:*):Stream} f function that receives the end event value,
 * and *must* return a new Stream to continue with.
 * @returns {Stream} new stream that emits all events from the original stream,
 * followed by all events from the stream returned by f.
 */
Stream$1.prototype.continueWith = function (f) {
  return continueWith(f, this)
};

// @deprecated use continueWith instead
Stream$1.prototype.flatMapEnd = Stream$1.prototype.continueWith;

Stream$1.prototype.concatMap = function (f) {
  return concatMap(f, this)
};

// -----------------------------------------------------------------------
// Concurrent merging

/**
 * Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer, limiting the number of inner streams that may
 * be active concurrently.
 * @param {number} concurrency at most this many inner streams will be
 *  allowed to be active concurrently.
 * @return {Stream<X>} new stream containing all events of all inner
 *  streams, with limited concurrency.
 */
Stream$1.prototype.mergeConcurrently = function (concurrency) {
  return mergeConcurrently(concurrency, this)
};

// -----------------------------------------------------------------------
// Merging

/**
 * Merge this stream and all the provided streams
 * @returns {Stream} stream containing items from this stream and s in time
 * order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */
Stream$1.prototype.merge = function (/* ...streams*/) {
  return mergeArray$1(cons(this, arguments))
};

// -----------------------------------------------------------------------
// Combining

/**
 * Combine latest events from all input streams
 * @param {function(...events):*} f function to combine most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */
Stream$1.prototype.combine = function (f /*, ...streams*/) {
  return combineArray(f, replace(this, 0, arguments))
};

// -----------------------------------------------------------------------
// Sampling

/**
 * When an event arrives on sampler, emit the latest event value from stream.
 * @param {Stream} sampler stream of events at whose arrival time
 *  signal's latest value will be propagated
 * @returns {Stream} sampled stream of values
 */
Stream$1.prototype.sampleWith = function (sampler) {
  return sampleWith(sampler, this)
};

/**
 * When an event arrives on this stream, emit the result of calling f with the latest
 * values of all streams being sampled
 * @param {function(...values):*} f function to apply to each set of sampled values
 * @returns {Stream} stream of sampled and transformed values
 */
Stream$1.prototype.sample = function (f /* ...streams */) {
  return sampleArray(f, this, tail$1$1(arguments))
};

// -----------------------------------------------------------------------
// Zipping

/**
 * Pair-wise combine items with those in s. Given 2 streams:
 * [1,2,3] zipWith f [4,5,6] -> [f(1,4),f(2,5),f(3,6)]
 * Note: zip causes fast streams to buffer and wait for slow streams.
 * @param {function(a:Stream, b:Stream, ...):*} f function to combine items
 * @returns {Stream} new stream containing pairs
 */
Stream$1.prototype.zip = function (f /*, ...streams*/) {
  return zipArray(f, replace(this, 0, arguments))
};

// -----------------------------------------------------------------------
// Switching

/**
 * Given a stream of streams, return a new stream that adopts the behavior
 * of the most recent inner stream.
 * @returns {Stream} switching stream
 */
Stream$1.prototype.switchLatest = function () {
  return switchLatest$1(this)
};

// @deprecated use switchLatest instead
Stream$1.prototype.switch = Stream$1.prototype.switchLatest;

// -----------------------------------------------------------------------
// Filtering

/**
 * Retain only items matching a predicate
 * stream:                           -12345678-
 * filter(x => x % 2 === 0, stream): --2-4-6-8-
 * @param {function(x:*):boolean} p filtering predicate called for each item
 * @returns {Stream} stream containing only items for which predicate returns truthy
 */
Stream$1.prototype.filter = function (p) {
  return filter(p, this)
};

/**
 * Skip repeated events, using === to compare items
 * stream:           -abbcd-
 * distinct(stream): -ab-cd-
 * @returns {Stream} stream with no repeated events
 */
Stream$1.prototype.skipRepeats = function () {
  return skipRepeats$1(this)
};

/**
 * Skip repeated events, using supplied equals function to compare items
 * @param {function(a:*, b:*):boolean} equals function to compare items
 * @returns {Stream} stream with no repeated events
 */
Stream$1.prototype.skipRepeatsWith = function (equals) {
  return skipRepeatsWith(equals, this)
};

// -----------------------------------------------------------------------
// Slicing

/**
 * stream:          -abcd-
 * take(2, stream): -ab|
 * @param {Number} n take up to this many events
 * @returns {Stream} stream containing at most the first n items from this stream
 */
Stream$1.prototype.take = function (n) {
  return take(n, this)
};

/**
 * stream:          -abcd->
 * skip(2, stream): ---cd->
 * @param {Number} n skip this many events
 * @returns {Stream} stream not containing the first n events
 */
Stream$1.prototype.skip = function (n) {
  return skip(n, this)
};

/**
 * Slice a stream by event index. Equivalent to, but more efficient than
 * stream.take(end).skip(start);
 * NOTE: Negative start and end are not supported
 * @param {Number} start skip all events before the start index
 * @param {Number} end allow all events from the start index to the end index
 * @returns {Stream} stream containing items where start <= index < end
 */
Stream$1.prototype.slice = function (start, end) {
  return slice(start, end, this)
};

/**
 * stream:                        -123451234->
 * takeWhile(x => x < 5, stream): -1234|
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items up to, but not including, the
 * first item for which p returns falsy.
 */
Stream$1.prototype.takeWhile = function (p) {
  return takeWhile(p, this)
};

/**
 * stream:                        -123451234->
 * skipWhile(x => x < 5, stream): -----51234->
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items following *and including* the
 * first item for which p returns falsy.
 */
Stream$1.prototype.skipWhile = function (p) {
  return skipWhile(p, this)
};

// -----------------------------------------------------------------------
// Time slicing

/**
 * stream:                    -a-b-c-d-e-f-g->
 * signal:                    -------x
 * takeUntil(signal, stream): -a-b-c-|
 * @param {Stream} signal retain only events in stream before the first
 * event in signal
 * @returns {Stream} new stream containing only events that occur before
 * the first event in signal.
 */
Stream$1.prototype.until = function (signal) {
  return takeUntil$1(signal, this)
};

// @deprecated use until instead
Stream$1.prototype.takeUntil = Stream$1.prototype.until;

  /**
 * stream:                    -a-b-c-d-e-f-g->
 * signal:                    -------x
 * takeUntil(signal, stream): -------d-e-f-g->
 * @param {Stream} signal retain only events in stream at or after the first
 * event in signal
 * @returns {Stream} new stream containing only events that occur after
 * the first event in signal.
 */
Stream$1.prototype.since = function (signal) {
  return skipUntil$1(signal, this)
};

// @deprecated use since instead
Stream$1.prototype.skipUntil = Stream$1.prototype.since;

  /**
 * stream:                    -a-b-c-d-e-f-g->
 * timeWindow:                -----s
 * s:                               -----t
 * stream.during(timeWindow): -----c-d-e-|
 * @param {Stream<Stream>} timeWindow a stream whose first event (s) represents
 *  the window start time.  That event (s) is itself a stream whose first event (t)
 *  represents the window end time
 * @returns {Stream} new stream containing only events within the provided timespan
 */
Stream$1.prototype.during = function (timeWindow) {
  return during(timeWindow, this)
};

// -----------------------------------------------------------------------
// Delaying

/**
 * @param {Number} delayTime milliseconds to delay each item
 * @returns {Stream} new stream containing the same items, but delayed by ms
 */
Stream$1.prototype.delay = function (delayTime) {
  return delay$1$1(delayTime, this)
};

// -----------------------------------------------------------------------
// Getting event timestamp

/**
 * Expose event timestamps into the stream. Turns a Stream<X> into
 * Stream<{time:t, value:X}>
 * @returns {Stream<{time:number, value:*}>}
 */
Stream$1.prototype.timestamp = function () {
  return timestamp(this)
};

// -----------------------------------------------------------------------
// Rate limiting

/**
 * Limit the rate of events
 * stream:              abcd----abcd----
 * throttle(2, stream): a-c-----a-c-----
 * @param {Number} period time to suppress events
 * @returns {Stream} new stream that skips events for throttle period
 */
Stream$1.prototype.throttle = function (period) {
  return throttle(period, this)
};

/**
 * Wait for a burst of events to subside and emit only the last event in the burst
 * stream:              abcd----abcd----
 * debounce(2, stream): -----d-------d--
 * @param {Number} period events occuring more frequently than this
 *  on the provided scheduler will be suppressed
 * @returns {Stream} new debounced stream
 */
Stream$1.prototype.debounce = function (period) {
  return debounce(period, this)
};

// -----------------------------------------------------------------------
// Awaiting Promises

/**
 * Await promises, turning a Stream<Promise<X>> into Stream<X>.  Preserves
 * event order, but timeshifts events based on promise resolution time.
 * @returns {Stream<X>} stream containing non-promise values
 */
Stream$1.prototype.awaitPromises = function () {
  return awaitPromises$1(this)
};

// @deprecated use awaitPromises instead
Stream$1.prototype.await = Stream$1.prototype.awaitPromises;

// -----------------------------------------------------------------------
// Error handling

/**
 * If this stream encounters an error, recover and continue with items from stream
 * returned by f.
 * stream:                  -a-b-c-X-
 * f(X):                           d-e-f-g-
 * flatMapError(f, stream): -a-b-c-d-e-f-g-
 * @param {function(error:*):Stream} f function which returns a new stream
 * @returns {Stream} new stream which will recover from an error by calling f
 */
Stream$1.prototype.recoverWith = function (f) {
  return flatMapError(f, this)
};

// @deprecated use recoverWith instead
Stream$1.prototype.flatMapError = Stream$1.prototype.recoverWith;

// -----------------------------------------------------------------------
// Multicasting

/**
 * Transform the stream into multicast stream.  That means that many subscribers
 * to the stream will not cause multiple invocations of the internal machinery.
 * @returns {Stream} new stream which will multicast events to all observers.
 */
Stream$1.prototype.multicast = function () {
  return multicast(this)
};

// export the instance of the defaultScheduler for third-party libraries
// export an implementation of Task used internally for third-party libraries

/** @license MIT License (c) copyright 2015-2016 original author or authors */
/** @author Brian Cavalier */
// domEvent :: (EventTarget t, Event e) => String -> t -> boolean=false -> Stream e
var domEvent = function (event, node, capture) {
    if ( capture === void 0 ) { capture = false; }

    return new Stream$1(new DomEvent(event, node, capture));
};

var input = function (node, capture) {
  if ( capture === void 0 ) { capture = false; }

  return domEvent('input', node, capture);
};
var DomEvent = function DomEvent (event, node, capture) {
  this.event = event;
  this.node = node;
  this.capture = capture;
};

DomEvent.prototype.run = function run (sink, scheduler) {
    var this$1 = this;

  var send = function (e) { return tryEvent$2(scheduler.now(), e, sink); };
  var dispose = function () { return this$1.node.removeEventListener(this$1.event, send, this$1.capture); };

  this.node.addEventListener(this.event, send, this.capture);

  return { dispose: dispose }
};

function tryEvent$2 (t, x, sink) {
  try {
    sink.event(t, x);
  } catch (e) {
    sink.error(t, e);
  }
}

var pipe = function (f, g) { return function (x) { return g(f(x)); }; };
var byId = function (id) { return document.getElementById(id); };

var add$1 = function (x, y) { return x + y; };

var numberValue = pipe(always, map$$2(pipe(function (input$$1) { return input$$1.value; }, Number)));

var x = numberValue(byId('x'));
var y = numberValue(byId('y'));
var z = liftA2(add$1, x, y);

var inputEvents = input(byId('container'));

var render = function (el) { return function (result) { return el.value = result; }; };
var update = pipe(sample$$2(inputEvents), tap$$1(render(byId('z'))));

runEffects$$1(update(z), newDefaultScheduler());

}());
