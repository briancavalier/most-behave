(function () {
'use strict';

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// Non-mutating array operations

// cons :: a -> [a] -> [a]
// a with x prepended
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
function reduce (f, z, a) {
  var r = z;
  for (var i = 0, l = a.length; i < l; ++i) {
    r = f(r, a[i], i);
  }
  return r
}

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

var RelativeScheduler = function RelativeScheduler (origin, scheduler) {
  this.origin = origin;
  this.scheduler = scheduler;
};

RelativeScheduler.prototype.currentTime = function currentTime () {
  return this.scheduler.currentTime() - this.origin
};

RelativeScheduler.prototype.scheduleTask = function scheduleTask (localOffset, delay, period, task) {
  return this.scheduler.scheduleTask(localOffset + this.origin, delay, period, task)
};

RelativeScheduler.prototype.relative = function relative (origin) {
  return new RelativeScheduler(origin + this.origin, this.scheduler)
};

RelativeScheduler.prototype.cancel = function cancel (task) {
  return this.scheduler.cancel(task)
};

RelativeScheduler.prototype.cancelAll = function cancelAll (f) {
  return this.scheduler.cancelAll(f)
};

// Read the current time from the provided Scheduler
var currentTime = function (scheduler) { return scheduler.currentTime(); };

// Schedule a task to run as soon as possible, but
// not in the current call stack
var asap = curry2(function (task, scheduler) { return scheduler.scheduleTask(0, 0, -1, task); });

// Schedule a task to run after a millisecond delay
var delay = curry3(function (delay, task, scheduler) { return scheduler.scheduleTask(0, delay, -1, task); });

// Schedule a task to run periodically, with the
// first run starting asap
var periodic = curry3(function (period, task, scheduler) { return scheduler.scheduleTask(0, 0, period, task); });

// Cancel all ScheduledTasks for which a predicate
// is true
var cancelAllTasks = curry2(function (predicate, scheduler) { return scheduler.cancelAll(predicate); });

var schedulerRelativeTo = curry2(function (offset, scheduler) { return new RelativeScheduler(offset, scheduler); });

/** @license MIT License (c) copyright 2010-2017 original author or authors */

// Wrap an existing disposable (which may not already have been once()d)
// so that it will only dispose its underlying resource at most once.
var disposeOnce = function (disposable) { return new DisposeOnce(disposable); };

var DisposeOnce = function DisposeOnce (disposable) {
  this.disposed = false;
  this.disposable = disposable;
};

DisposeOnce.prototype.dispose = function dispose () {
  if (!this.disposed) {
    this.disposed = true;
    this.disposable.dispose();
    this.disposable = undefined;
  }
};

/** @license MIT License (c) copyright 2010-2017 original author or authors */
// Aggregate a list of disposables into a DisposeAll
var disposeAll = function (ds) { return new DisposeAll(ds); };

// Convenience to aggregate 2 disposables
var disposeBoth = curry2(function (d1, d2) { return disposeAll([d1, d2]); });

var DisposeAll = function DisposeAll (disposables) {
  this.disposables = disposables;
};

DisposeAll.prototype.dispose = function dispose () {
  throwIfErrors(disposeCollectErrors(this.disposables));
};

// Dispose all, safely collecting errors into an array
var disposeCollectErrors = function (disposables) { return reduce(appendIfError, [], disposables); };

// Call dispose and if throws, append thrown error to errors
var appendIfError = function (errors, d) {
  try {
    d.dispose();
  } catch (e) {
    errors.push(e);
  }
  return errors
};

// Throw DisposeAllError if errors is non-empty
var throwIfErrors = function (errors) {
  if (errors.length > 0) {
    throw new DisposeAllError(((errors.length) + " errors"), errors)
  }
};

// Aggregate Error type for DisposeAll
var DisposeAllError = (function (Error) {
  function DisposeAllError (message, errors) {
    Error.call(this, message);
    this.message = message;
    this.name = this.constructor.name;
    this.errors = errors;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.stack = "" + (this.stack) + (formatErrorStacks(this.errors));
  }

  if ( Error ) { DisposeAllError.__proto__ = Error; }
  DisposeAllError.prototype = Object.create( Error && Error.prototype );
  DisposeAllError.prototype.constructor = DisposeAllError;

  DisposeAllError.prototype.toString = function toString () {
    return this.stack
  };

  return DisposeAllError;
}(Error));

var formatErrorStacks = function (errors) { return reduce(formatErrorStack, '', errors); };

var formatErrorStack = function (s, e, i) { return s + "\n[" + ((i + 1)) + "] " + (e.stack); };

/** @license MIT License (c) copyright 2010-2017 original author or authors */
// Try to dispose the disposable.  If it throws, send
// the error to sink.error with the provided Time value
var tryDispose = curry3(function (t, disposable, sink) {
  try {
    disposable.dispose();
  } catch (e) {
    sink.error(t, e);
  }
});

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function fatalError (e) {
  setTimeout(rethrow, 0, e);
}

function rethrow (e) {
  throw e
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var propagateTask$1 = function (run, value, sink) { return new PropagateTask(run, value, sink); };

var propagateEventTask$1 = function (value, sink) { return propagateTask$1(runEvent, value, sink); };

var propagateEndTask = function (sink) { return propagateTask$1(runEnd, undefined, sink); };

var PropagateTask = function PropagateTask (run, value, sink) {
  this._run = run;
  this.value = value;
  this.sink = sink;
  this.active = true;
};

PropagateTask.prototype.dispose = function dispose$$1 () {
  this.active = false;
};

PropagateTask.prototype.run = function run (t) {
  if (!this.active) {
    return
  }
  var run = this._run;
  run(t, this.value, this.sink);
};

PropagateTask.prototype.error = function error (t, e) {
  // TODO: Remove this check and just do this.sink.error(t, e)?
  if (!this.active) {
    return fatalError(e)
  }
  this.sink.error(t, e);
};

var runEvent = function (t, x, sink) { return sink.event(t, x); };

var runEnd = function (t, _, sink) { return sink.end(t); };

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var empty = function () { return EMPTY; };

var Empty = function Empty () {};

Empty.prototype.run = function run (sink, scheduler$$1) {
  return asap(propagateEndTask(sink), scheduler$$1)
};

var EMPTY = new Empty();

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var at = function (t, x) { return new At(t, x); };

var At = function At (t, x) {
  this.time = t;
  this.value = x;
};

At.prototype.run = function run (sink, scheduler$$1) {
  return delay(this.time, propagateTask$1(runAt, this.value, sink), scheduler$$1)
};

function runAt (t, x, sink) {
  sink.event(t, x);
  sink.end(t);
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var now = function (x) { return at(0, x); };

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Create a stream of events that occur at a regular period
 * @param {Number} period periodicity of events
 * @returns {Stream} new stream of periodic events, the event value is undefined
 */
var periodic$1 = function (period) { return new Periodic(period); };

var Periodic = function Periodic (period) {
  this.period = period;
};

Periodic.prototype.run = function run (sink, scheduler$$1) {
  return periodic(this.period, propagateEventTask$1(undefined, sink), scheduler$$1)
};

/** @license MIT License (c) copyright 2010-2017 original author or authors */
/** @author Brian Cavalier */

var Pipe = function Pipe (sink) {
  this.sink = sink;
};

Pipe.prototype.event = function event (t, x) {
  return this.sink.event(t, x)
};

Pipe.prototype.end = function end (t) {
  return this.sink.end(t)
};

Pipe.prototype.error = function error (t, e) {
  return this.sink.error(t, e)
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Filter = function Filter (p, source) {
  this.p = p;
  this.source = source;
};

Filter.prototype.run = function run (sink, scheduler$$1) {
  return this.source.run(new FilterSink(this.p, sink), scheduler$$1)
};

/**
 * Create a filtered source, fusing adjacent filter.filter if possible
 * @param {function(x:*):boolean} p filtering predicate
 * @param {{run:function}} source source to filter
 * @returns {Filter} filtered source
 */
Filter.create = function create (p, source) {
  if (source instanceof Filter) {
    return new Filter(and(source.p, p), source.source)
  }

  return new Filter(p, source)
};

var FilterSink = (function (Pipe$$1) {
  function FilterSink (p, sink) {
    Pipe$$1.call(this, sink);
    this.p = p;
  }

  if ( Pipe$$1 ) { FilterSink.__proto__ = Pipe$$1; }
  FilterSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  FilterSink.prototype.constructor = FilterSink;

  FilterSink.prototype.event = function event (t, x) {
    var p = this.p;
    p(x) && this.sink.event(t, x);
  };

  return FilterSink;
}(Pipe));

var and = function (p, q) { return function (x) { return p(x) && q(x); }; };

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var FilterMap = function FilterMap (p, f, source) {
  this.p = p;
  this.f = f;
  this.source = source;
};

FilterMap.prototype.run = function run (sink, scheduler$$1) {
  return this.source.run(new FilterMapSink(this.p, this.f, sink), scheduler$$1)
};

var FilterMapSink = (function (Pipe$$1) {
  function FilterMapSink (p, f, sink) {
    Pipe$$1.call(this, sink);
    this.p = p;
    this.f = f;
  }

  if ( Pipe$$1 ) { FilterMapSink.__proto__ = Pipe$$1; }
  FilterMapSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  FilterMapSink.prototype.constructor = FilterMapSink;

  FilterMapSink.prototype.event = function event (t, x) {
    var f = this.f;
    var p = this.p;
    p(x) && this.sink.event(t, f(x));
  };

  return FilterMapSink;
}(Pipe));

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Map = function Map (f, source) {
  this.f = f;
  this.source = source;
};

Map.prototype.run = function run (sink, scheduler$$1) { // eslint-disable-line no-extend-native
  return this.source.run(new MapSink(this.f, sink), scheduler$$1)
};

/**
 * Create a mapped source, fusing adjacent map.map, filter.map,
 * and filter.map.map if possible
 * @param {function(*):*} f mapping function
 * @param {{run:function}} source source to map
 * @returns {Map|FilterMap} mapped source, possibly fused
 */
Map.create = function create (f, source) {
  if (source instanceof Map) {
    return new Map(compose(f, source.f), source.source)
  }

  if (source instanceof Filter) {
    return new FilterMap(source.p, f, source.source)
  }

  return new Map(f, source)
};

var MapSink = (function (Pipe$$1) {
  function MapSink (f, sink) {
    Pipe$$1.call(this, sink);
    this.f = f;
  }

  if ( Pipe$$1 ) { MapSink.__proto__ = Pipe$$1; }
  MapSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  MapSink.prototype.constructor = MapSink;

  MapSink.prototype.event = function event (t, x) {
    var f = this.f;
    this.sink.event(t, f(x));
  };

  return MapSink;
}(Pipe));

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var SettableDisposable = function SettableDisposable () {
  this.disposable = undefined;
  this.disposed = false;
};

SettableDisposable.prototype.setDisposable = function setDisposable (disposable$$1) {
  if (this.disposable !== void 0) {
    throw new Error('setDisposable called more than once')
  }

  this.disposable = disposable$$1;

  if (this.disposed) {
    disposable$$1.dispose();
  }
};

SettableDisposable.prototype.dispose = function dispose$$1 () {
  if (this.disposed) {
    return
  }

  this.disposed = true;

  if (this.disposable !== void 0) {
    this.disposable.dispose();
  }
};

var SliceSink = (function (Pipe$$1) {
  function SliceSink (skip, take, sink, disposable$$1) {
    Pipe$$1.call(this, sink);
    this.skip = skip;
    this.take = take;
    this.disposable = disposable$$1;
  }

  if ( Pipe$$1 ) { SliceSink.__proto__ = Pipe$$1; }
  SliceSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  SliceSink.prototype.constructor = SliceSink;

  SliceSink.prototype.event = function event (t, x) {
    /* eslint complexity: [1, 4] */
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
      this.disposable.dispose();
      this.sink.end(t);
    }
  };

  return SliceSink;
}(Pipe));

var TakeWhileSink = (function (Pipe$$1) {
  function TakeWhileSink (p, sink, disposable$$1) {
    Pipe$$1.call(this, sink);
    this.p = p;
    this.active = true;
    this.disposable = disposable$$1;
  }

  if ( Pipe$$1 ) { TakeWhileSink.__proto__ = Pipe$$1; }
  TakeWhileSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  TakeWhileSink.prototype.constructor = TakeWhileSink;

  TakeWhileSink.prototype.event = function event (t, x) {
    if (!this.active) {
      return
    }

    var p = this.p;
    this.active = p(x);

    if (this.active) {
      this.sink.event(t, x);
    } else {
      this.disposable.dispose();
      this.sink.end(t);
    }
  };

  return TakeWhileSink;
}(Pipe));

var SkipWhileSink = (function (Pipe$$1) {
  function SkipWhileSink (p, sink) {
    Pipe$$1.call(this, sink);
    this.p = p;
    this.skipping = true;
  }

  if ( Pipe$$1 ) { SkipWhileSink.__proto__ = Pipe$$1; }
  SkipWhileSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  SkipWhileSink.prototype.constructor = SkipWhileSink;

  SkipWhileSink.prototype.event = function event (t, x) {
    if (this.skipping) {
      var p = this.p;
      this.skipping = p(x);
      if (this.skipping) {
        return
      }
    }

    this.sink.event(t, x);
  };

  return SkipWhileSink;
}(Pipe));

var SkipAfterSink = (function (Pipe$$1) {
  function SkipAfterSink (p, sink) {
    Pipe$$1.call(this, sink);
    this.p = p;
    this.skipping = false;
  }

  if ( Pipe$$1 ) { SkipAfterSink.__proto__ = Pipe$$1; }
  SkipAfterSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  SkipAfterSink.prototype.constructor = SkipAfterSink;

  SkipAfterSink.prototype.event = function event (t, x) {
    if (this.skipping) {
      return
    }

    var p = this.p;
    this.skipping = p(x);
    this.sink.event(t, x);

    if (this.skipping) {
      this.sink.end(t);
    }
  };

  return SkipAfterSink;
}(Pipe));

var ZipItemsSink = (function (Pipe$$1) {
  function ZipItemsSink (f, items, sink) {
    Pipe$$1.call(this, sink);
    this.f = f;
    this.items = items;
    this.index = 0;
  }

  if ( Pipe$$1 ) { ZipItemsSink.__proto__ = Pipe$$1; }
  ZipItemsSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  ZipItemsSink.prototype.constructor = ZipItemsSink;

  ZipItemsSink.prototype.event = function event (t, b) {
    var f = this.f;
    this.sink.event(t, f(this.items[this.index], b));
    this.index += 1;
  };

  return ZipItemsSink;
}(Pipe));

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var runEffects$1 = curry2(function (stream, scheduler$$1) { return new Promise(function (resolve, reject) { return runStream(stream, scheduler$$1, resolve, reject); }); });

function runStream (stream, scheduler$$1, resolve, reject) {
  var disposable$$1 = new SettableDisposable();
  var observer = new RunEffectsSink(resolve, reject, disposable$$1);

  disposable$$1.setDisposable(stream.run(observer, scheduler$$1));
}

var RunEffectsSink = function RunEffectsSink (end, error, disposable$$1) {
  this._end = end;
  this._error = error;
  this._disposable = disposable$$1;
  this.active = true;
};

RunEffectsSink.prototype.event = function event (t, x) {};

RunEffectsSink.prototype.end = function end (t) {
  if (!this.active) {
    return
  }
  this._dispose(this._error, this._end, undefined);
};

RunEffectsSink.prototype.error = function error (t, e) {
  this._dispose(this._error, this._error, e);
};

RunEffectsSink.prototype._dispose = function _dispose (error, end, x) {
  this.active = false;
  tryDispose$1(error, end, x, this._disposable);
};

function tryDispose$1 (error, end, x, disposable$$1) {
  try {
    disposable$$1.dispose();
  } catch (e) {
    error(e);
    return
  }

  end(x);
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */

// Run a Stream, sending all its events to the
// provided Sink.
var run$1 = function (sink, scheduler$$1, stream) { return stream.run(sink, scheduler$$1); };

var RelativeSink = function RelativeSink (offset, sink) {
  this.sink = sink;
  this.offset = offset;
};

RelativeSink.prototype.event = function event (t, x) {
  this.sink.event(t + this.offset, x);
};

RelativeSink.prototype.error = function error (t, e) {
  this.sink.error(t + this.offset, e);
};

RelativeSink.prototype.end = function end (t) {
  this.sink.end(t + this.offset);
};

// Create a stream with its own local clock
// This transforms time from the provided scheduler's clock to a stream-local
// clock (which starts at 0), and then *back* to the scheduler's clock before
// propagating events to sink.  In other words, upstream sources will see local times,
// and downstream sinks will see non-local (original) times.
var withLocalTime$1 = function (origin, stream) { return new WithLocalTime(origin, stream); };

var WithLocalTime = function WithLocalTime (origin, source) {
  this.origin = origin;
  this.source = source;
};

WithLocalTime.prototype.run = function run (sink, scheduler$$1) {
  return this.source.run(relativeSink(this.origin, sink), schedulerRelativeTo(this.origin, scheduler$$1))
};

// Accumulate offsets instead of nesting RelativeSinks, which can happen
// with higher-order stream and combinators like continueWith when they're
// applied recursively.
var relativeSink = function (origin, sink) { return sink instanceof RelativeSink
    ? new RelativeSink(origin + sink.offset, sink.sink)
    : new RelativeSink(origin, sink); };

var LoopSink = (function (Pipe$$1) {
  function LoopSink (stepper, seed, sink) {
    Pipe$$1.call(this, sink);
    this.step = stepper;
    this.seed = seed;
  }

  if ( Pipe$$1 ) { LoopSink.__proto__ = Pipe$$1; }
  LoopSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  LoopSink.prototype.constructor = LoopSink;

  LoopSink.prototype.event = function event (t, x) {
    var result = this.step(this.seed, x);
    this.seed = result.seed;
    this.sink.event(t, result.value);
  };

  return LoopSink;
}(Pipe));

var ScanSink = (function (Pipe$$1) {
  function ScanSink (f, z, sink) {
    Pipe$$1.call(this, sink);
    this.f = f;
    this.value = z;
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

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var continueWith$1 = function (f, stream) { return new ContinueWith(f, stream); };

var ContinueWith = function ContinueWith (f, source) {
  this.f = f;
  this.source = source;
};

ContinueWith.prototype.run = function run (sink, scheduler$$1) {
  return new ContinueWithSink(this.f, this.source, sink, scheduler$$1)
};

var ContinueWithSink = (function (Pipe$$1) {
  function ContinueWithSink (f, source, sink, scheduler$$1) {
    Pipe$$1.call(this, sink);
    this.f = f;
    this.scheduler = scheduler$$1;
    this.active = true;
    this.disposable = disposeOnce(source.run(this, scheduler$$1));
  }

  if ( Pipe$$1 ) { ContinueWithSink.__proto__ = Pipe$$1; }
  ContinueWithSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  ContinueWithSink.prototype.constructor = ContinueWithSink;

  ContinueWithSink.prototype.event = function event (t, x) {
    if (!this.active) {
      return
    }
    this.sink.event(t, x);
  };

  ContinueWithSink.prototype.end = function end (t) {
    if (!this.active) {
      return
    }

    tryDispose(t, this.disposable, this.sink);

    this._startNext(t, this.sink);
  };

  ContinueWithSink.prototype._startNext = function _startNext (t, sink) {
    try {
      this.disposable = this._continue(this.f, t, sink);
    } catch (e) {
      sink.error(t, e);
    }
  };

  ContinueWithSink.prototype._continue = function _continue (f, t, sink) {
    return run$1(sink, this.scheduler, withLocalTime$1(t, f()))
  };

  ContinueWithSink.prototype.dispose = function dispose$$1 () {
    this.active = false;
    return this.disposable.dispose()
  };

  return ContinueWithSink;
}(Pipe));

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var startWith$1 = function (x, stream) { return continueWith$1(function () { return stream; }, now(x)); };

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @param {Stream} stream stream to map
 * @returns {Stream} stream containing items transformed by f
 */
var map$2 = function (f, stream) { return Map.create(f, stream); };

/**
* Replace each value in the stream with x
* @param {*} x
* @param {Stream} stream
* @returns {Stream} stream containing items replaced with x
*/
var constant$1 = function (x, stream) { return map$2(function () { return x; }, stream); };

/**
* Perform a side effect for each item in the stream
* @param {function(x:*):*} f side effect to execute for each item. The
*  return value will be discarded.
* @param {Stream} stream stream to tap
* @returns {Stream} new stream containing the same items as this stream
*/
var tap$1 = function (f, stream) { return new Tap(f, stream); };

var Tap = function Tap (f, source) {
  this.source = source;
  this.f = f;
};

Tap.prototype.run = function run (sink, scheduler$$1) {
  return this.source.run(new TapSink(this.f, sink), scheduler$$1)
};

var TapSink = (function (Pipe$$1) {
  function TapSink (f, sink) {
    Pipe$$1.call(this, sink);
    this.f = f;
  }

  if ( Pipe$$1 ) { TapSink.__proto__ = Pipe$$1; }
  TapSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  TapSink.prototype.constructor = TapSink;

  TapSink.prototype.event = function event (t, x) {
    var f = this.f;
    f(x);
    this.sink.event(t, x);
  };

  return TapSink;
}(Pipe));

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var IndexSink = (function (Sink) {
  function IndexSink (i, sink) {
    Sink.call(this, sink);
    this.index = i;
    this.active = true;
    this.value = undefined;
  }

  if ( Sink ) { IndexSink.__proto__ = Sink; }
  IndexSink.prototype = Object.create( Sink && Sink.prototype );
  IndexSink.prototype.constructor = IndexSink;

  IndexSink.prototype.event = function event (t, x) {
    if (!this.active) {
      return
    }
    this.value = x;
    this.sink.event(t, this);
  };

  IndexSink.prototype.end = function end (t) {
    if (!this.active) {
      return
    }
    this.active = false;
    this.sink.event(t, this);
  };

  return IndexSink;
}(Pipe));

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function invoke (f, args) {
  /* eslint complexity: [2,7] */
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

var CombineSink = (function (Pipe$$1) {
  function CombineSink (disposables, sinks, sink, f) {
    Pipe$$1.call(this, sink);
    this.disposables = disposables;
    this.sinks = sinks;
    this.f = f;

    var l = sinks.length;
    this.awaiting = l;
    this.values = new Array(l);
    this.hasValue = new Array(l).fill(false);
    this.activeCount = sinks.length;
  }

  if ( Pipe$$1 ) { CombineSink.__proto__ = Pipe$$1; }
  CombineSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  CombineSink.prototype.constructor = CombineSink;

  CombineSink.prototype.event = function event (t, indexedValue) {
    if (!indexedValue.active) {
      this._dispose(t, indexedValue.index);
      return
    }

    var i = indexedValue.index;
    var awaiting = this._updateReady(i);

    this.values[i] = indexedValue.value;
    if (awaiting === 0) {
      this.sink.event(t, invoke(this.f, this.values));
    }
  };

  CombineSink.prototype._updateReady = function _updateReady (index) {
    if (this.awaiting > 0) {
      if (!this.hasValue[index]) {
        this.hasValue[index] = true;
        this.awaiting -= 1;
      }
    }
    return this.awaiting
  };

  CombineSink.prototype._dispose = function _dispose (t, index) {
    tryDispose(t, this.disposables[index], this.sink);
    if (--this.activeCount === 0) {
      this.sink.end(t);
    }
  };

  return CombineSink;
}(Pipe));

/**
 * @param {Array} streams array of stream to merge
 * @returns {Stream} stream containing events from all input observables
 * in time order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */
var mergeArray = function (streams) { return streams.length === 0 ? empty()
    : streams.length === 1 ? streams[0]
    : mergeStreams(streams); };

/**
 * This implements fusion/flattening for merge.  It will
 * fuse adjacent merge operations.  For example:
 * - a.merge(b).merge(c) effectively becomes merge(a, b, c)
 * - merge(a, merge(b, c)) effectively becomes merge(a, b, c)
 * It does this by concatenating the sources arrays of
 * any nested Merge sources, in effect "flattening" nested
 * merge operations into a single merge.
 */
var mergeStreams = function (streams) { return new Merge(reduce(appendSources, [], streams)); };

var appendSources = function (sources, stream) { return sources.concat(stream instanceof Merge ? stream.sources : stream); };

var Merge = function Merge (sources) {
  this.sources = sources;
};

Merge.prototype.run = function run (sink, scheduler$$1) {
    var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l);
  var sinks = new Array(l);

  var mergeSink = new MergeSink(disposables, sinks, sink);

  for (var indexSink = (void 0), i = 0; i < l; ++i) {
    indexSink = sinks[i] = new IndexSink(i, mergeSink);
    disposables[i] = this$1.sources[i].run(indexSink, scheduler$$1);
  }

  return disposeAll(disposables)
};

var MergeSink = (function (Pipe$$1) {
  function MergeSink (disposables, sinks, sink) {
    Pipe$$1.call(this, sink);
    this.disposables = disposables;
    this.activeCount = sinks.length;
  }

  if ( Pipe$$1 ) { MergeSink.__proto__ = Pipe$$1; }
  MergeSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  MergeSink.prototype.constructor = MergeSink;

  MergeSink.prototype.event = function event (t, indexValue) {
    if (!indexValue.active) {
      this._dispose(t, indexValue.index);
      return
    }
    this.sink.event(t, indexValue.value);
  };

  MergeSink.prototype._dispose = function _dispose (t, index) {
    tryDispose(t, this.disposables[index], this.sink);
    if (--this.activeCount === 0) {
      this.sink.end(t);
    }
  };

  return MergeSink;
}(Pipe));

var SnapshotSink = (function (Pipe$$1) {
  function SnapshotSink (f, sink) {
    Pipe$$1.call(this, sink);
    this.f = f;
    this.latest = new LatestValueSink(this);
  }

  if ( Pipe$$1 ) { SnapshotSink.__proto__ = Pipe$$1; }
  SnapshotSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  SnapshotSink.prototype.constructor = SnapshotSink;

  SnapshotSink.prototype.event = function event (t, x) {
    if (this.latest.hasValue) {
      var f = this.f;
      this.sink.event(t, f(this.latest.value, x));
    }
  };

  return SnapshotSink;
}(Pipe));

var LatestValueSink = (function (Pipe$$1) {
  function LatestValueSink (sink) {
    Pipe$$1.call(this, sink);
    this.hasValue = false;
  }

  if ( Pipe$$1 ) { LatestValueSink.__proto__ = Pipe$$1; }
  LatestValueSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  LatestValueSink.prototype.constructor = LatestValueSink;

  LatestValueSink.prototype.event = function event (t, x) {
    this.value = x;
    this.hasValue = true;
  };

  LatestValueSink.prototype.end = function end () {};

  return LatestValueSink;
}(Pipe));

var ZipSink = (function (Pipe$$1) {
  function ZipSink (f, buffers, sinks, sink) {
    Pipe$$1.call(this, sink);
    this.f = f;
    this.sinks = sinks;
    this.buffers = buffers;
  }

  if ( Pipe$$1 ) { ZipSink.__proto__ = Pipe$$1; }
  ZipSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  ZipSink.prototype.constructor = ZipSink;

  ZipSink.prototype.event = function event (t, indexedValue) {
    /* eslint complexity: [1, 5] */
    if (!indexedValue.active) {
      this._dispose(t, indexedValue.index);
      return
    }

    var buffers = this.buffers;
    var buffer = buffers[indexedValue.index];

    buffer.push(indexedValue.value);

    if (buffer.length() === 1) {
      if (!ready(this.buffers)) {
        return
      }

      emitZipped(this.f, t, buffers, this.sink);

      if (ended(this.buffers, this.sinks)) {
        this.sink.end(t);
      }
    }
  };

  ZipSink.prototype._dispose = function _dispose (t, index) {
    var buffer = this.buffers[index];
    if (buffer.isEmpty()) {
      this.sink.end(t);
    }
  };

  return ZipSink;
}(Pipe));

var emitZipped = function (f, t, buffers, sink) { return sink.event(t, invoke(f, map$1$1(head, buffers))); };

var head = function (buffer) { return buffer.shift(); };

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

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Given a stream of streams, return a new stream that adopts the behavior
 * of the most recent inner stream.
 * @param {Stream} stream of streams on which to switch
 * @returns {Stream} switching stream
 */
var switchLatest = function (stream) { return new Switch(stream); };

var Switch = function Switch (source) {
  this.source = source;
};

Switch.prototype.run = function run (sink, scheduler$$1) {
  var switchSink = new SwitchSink(sink, scheduler$$1);
  return disposeBoth(switchSink, this.source.run(switchSink, scheduler$$1))
};

var SwitchSink = function SwitchSink (sink, scheduler$$1) {
  this.sink = sink;
  this.scheduler = scheduler$$1;
  this.current = null;
  this.ended = false;
};

SwitchSink.prototype.event = function event (t, stream) {
  this._disposeCurrent(t);
  this.current = new Segment(stream, t, Infinity, this, this.sink, this.scheduler);
};

SwitchSink.prototype.end = function end (t) {
  this.ended = true;
  this._checkEnd(t);
};

SwitchSink.prototype.error = function error (t, e) {
  this.ended = true;
  this.sink.error(t, e);
};

SwitchSink.prototype.dispose = function dispose$$1 () {
  return this._disposeCurrent(currentTime(this.scheduler))
};

SwitchSink.prototype._disposeCurrent = function _disposeCurrent (t) {
  if (this.current !== null) {
    return this.current._dispose(t)
  }
};

SwitchSink.prototype._disposeInner = function _disposeInner (t, inner) {
  inner._dispose(t);
  if (inner === this.current) {
    this.current = null;
  }
};

SwitchSink.prototype._checkEnd = function _checkEnd (t) {
  if (this.ended && this.current === null) {
    this.sink.end(t);
  }
};

SwitchSink.prototype._endInner = function _endInner (t, inner) {
  this._disposeInner(t, inner);
  this._checkEnd(t);
};

SwitchSink.prototype._errorInner = function _errorInner (t, e, inner) {
  this._disposeInner(t, inner);
  this.sink.error(t, e);
};

var Segment = function Segment (source, min, max, outer, sink, scheduler$$1) {
  this.min = min;
  this.max = max;
  this.outer = outer;
  this.sink = sink;
  this.disposable = source.run(this, schedulerRelativeTo(min, scheduler$$1));
};

Segment.prototype.event = function event (t, x) {
  var time = Math.max(0, t + this.min);
  if (time < this.max) {
    this.sink.event(time, x);
  }
};

Segment.prototype.end = function end (t) {
  this.outer._endInner(t + this.min, this);
};

Segment.prototype.error = function error (t, e) {
  this.outer._errorInner(t + this.min, e, this);
};

Segment.prototype._dispose = function _dispose (t) {
  tryDispose(t + this.min, this.disposable, this.sink);
};

var SkipRepeatsSink = (function (Pipe$$1) {
  function SkipRepeatsSink (equals, sink) {
    Pipe$$1.call(this, sink);
    this.equals = equals;
    this.value = void 0;
    this.init = true;
  }

  if ( Pipe$$1 ) { SkipRepeatsSink.__proto__ = Pipe$$1; }
  SkipRepeatsSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  SkipRepeatsSink.prototype.constructor = SkipRepeatsSink;

  SkipRepeatsSink.prototype.event = function event (t, x) {
    if (this.init) {
      this.init = false;
      this.value = x;
      this.sink.event(t, x);
    } else if (!this.equals(this.value, x)) {
      this.value = x;
      this.sink.event(t, x);
    }
  };

  return SkipRepeatsSink;
}(Pipe));

var Bound = (function (Pipe$$1) {
  function Bound (value, sink) {
    Pipe$$1.call(this, sink);
    this.value = value;
  }

  if ( Pipe$$1 ) { Bound.__proto__ = Pipe$$1; }
  Bound.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  Bound.prototype.constructor = Bound;

  Bound.prototype.event = function event () {};
  Bound.prototype.end = function end () {};

  Bound.prototype.dispose = function dispose$$1 () {};

  return Bound;
}(Pipe));

var TimeWindowSink = (function (Pipe$$1) {
  function TimeWindowSink (min, max, sink) {
    Pipe$$1.call(this, sink);
    this.min = min;
    this.max = max;
  }

  if ( Pipe$$1 ) { TimeWindowSink.__proto__ = Pipe$$1; }
  TimeWindowSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  TimeWindowSink.prototype.constructor = TimeWindowSink;

  TimeWindowSink.prototype.event = function event (t, x) {
    if (t >= this.min.value && t < this.max.value) {
      this.sink.event(t, x);
    }
  };

  return TimeWindowSink;
}(Pipe));

var LowerBound = (function (Pipe$$1) {
  function LowerBound (signal, sink, scheduler$$1) {
    Pipe$$1.call(this, sink);
    this.value = Infinity;
    this.disposable = signal.run(this, scheduler$$1);
  }

  if ( Pipe$$1 ) { LowerBound.__proto__ = Pipe$$1; }
  LowerBound.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  LowerBound.prototype.constructor = LowerBound;

  LowerBound.prototype.event = function event (t /* x */) {
    if (t < this.value) {
      this.value = t;
    }
  };

  LowerBound.prototype.end = function end () {};

  LowerBound.prototype.dispose = function dispose$$1 () {
    return this.disposable.dispose()
  };

  return LowerBound;
}(Pipe));

var UpperBound = (function (Pipe$$1) {
  function UpperBound (signal, sink, scheduler$$1) {
    Pipe$$1.call(this, sink);
    this.value = Infinity;
    this.disposable = signal.run(this, scheduler$$1);
  }

  if ( Pipe$$1 ) { UpperBound.__proto__ = Pipe$$1; }
  UpperBound.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  UpperBound.prototype.constructor = UpperBound;

  UpperBound.prototype.event = function event (t, x) {
    if (t < this.value) {
      this.value = t;
      this.sink.end(t);
    }
  };

  UpperBound.prototype.end = function end () {};

  UpperBound.prototype.dispose = function dispose$$1 () {
    return this.disposable.dispose()
  };

  return UpperBound;
}(Pipe));

var DelaySink = (function (Pipe$$1) {
  function DelaySink (dt, sink, scheduler$$1) {
    Pipe$$1.call(this, sink);
    this.dt = dt;
    this.scheduler = scheduler$$1;
  }

  if ( Pipe$$1 ) { DelaySink.__proto__ = Pipe$$1; }
  DelaySink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  DelaySink.prototype.constructor = DelaySink;

  DelaySink.prototype.dispose = function dispose$$1 () {
    var this$1 = this;

    cancelAllTasks(function (task) { return task.sink === this$1.sink; }, this.scheduler);
  };

  DelaySink.prototype.event = function event (t, x) {
    delay(this.dt, propagateEventTask$1(x, this.sink), this.scheduler);
  };

  DelaySink.prototype.end = function end (t) {
    delay(this.dt, propagateEndTask(this.sink), this.scheduler);
  };

  return DelaySink;
}(Pipe));

var ThrottleSink = (function (Pipe$$1) {
  function ThrottleSink (period, sink) {
    Pipe$$1.call(this, sink);
    this.time = 0;
    this.period = period;
  }

  if ( Pipe$$1 ) { ThrottleSink.__proto__ = Pipe$$1; }
  ThrottleSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  ThrottleSink.prototype.constructor = ThrottleSink;

  ThrottleSink.prototype.event = function event (t, x) {
    if (t >= this.time) {
      this.time = t + this.period;
      this.sink.event(t, x);
    }
  };

  return ThrottleSink;
}(Pipe));
// -----------------------------------------------------------------------
// Observing

var runEffects$$1 = curry2(runEffects$1);
// -----------------------------------------------------------------------
// Extending

var startWith$$1 = curry2(startWith$1);

var constant$$1 = curry2(constant$1);
var tap$$1 = curry2(tap$1);

//      
                                                                            

var snapshotTime =        function (f                , stream           )            { return new SnapshotTime(f, stream); };

var SnapshotTime = function SnapshotTime (f              , source         ) {
  this.f = f;
  this.source = source;
};

SnapshotTime.prototype.run = function run (sink       , scheduler         )           {
  return this.source.run(new SnapshotTimeSink(this.f, sink), scheduler)
};

var SnapshotTimeSink = function SnapshotTimeSink (f              , sink       ) {
  this.f = f;
  this.sink = sink;
};

SnapshotTimeSink.prototype.event = function event (t    , x )     {
  var f = this.f;
  this.sink.event(t, f(t, x));
};

SnapshotTimeSink.prototype.error = function error (t    , e     )     {
  this.sink.error(t, e);
};

SnapshotTimeSink.prototype.end = function end (t    )     {
  this.sink.end(t);
};

//      
                                               
// eslint-disable-line

var sample =        function (b             , s           )            { return snapshot$$2(function (a, b) { return a; }, b, s); };

var snapshot$$2 =           function (f             , b             , s           )            { return b(f, s); };

var time = function ()                 { return snapshotTime; };

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var ScheduledTask$1 = function ScheduledTask (time, localOffset, period, task, scheduler) {
  this.time = time;
  this.localOffset = localOffset;
  this.period = period;
  this.task = task;
  this.scheduler = scheduler;
  this.active = true;
};

ScheduledTask$1.prototype.run = function run () {
  return this.task.run(this.time - this.localOffset)
};

ScheduledTask$1.prototype.error = function error (e) {
  return this.task.error(this.time - this.localOffset, e)
};

ScheduledTask$1.prototype.dispose = function dispose () {
  this.scheduler.cancel(this);
  return this.task.dispose()
};

var RelativeScheduler$1 = function RelativeScheduler (origin, scheduler) {
  this.origin = origin;
  this.scheduler = scheduler;
};

RelativeScheduler$1.prototype.currentTime = function currentTime () {
  return this.scheduler.currentTime() - this.origin
};

RelativeScheduler$1.prototype.scheduleTask = function scheduleTask (localOffset, delay, period, task) {
  return this.scheduler.scheduleTask(localOffset + this.origin, delay, period, task)
};

RelativeScheduler$1.prototype.relative = function relative (origin) {
  return new RelativeScheduler$1(origin + this.origin, this.scheduler)
};

RelativeScheduler$1.prototype.cancel = function cancel (task) {
  return this.scheduler.cancel(task)
};

RelativeScheduler$1.prototype.cancelAll = function cancelAll (f) {
  return this.scheduler.cancelAll(f)
};

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var defer$1 = function (task) { return Promise.resolve(task).then(runTask$1); };

function runTask$1 (task) {
  try {
    return task.run()
  } catch (e) {
    return task.error(e)
  }
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var Scheduler$1 = function Scheduler (timer, timeline) {
  var this$1 = this;

  this.timer = timer;
  this.timeline = timeline;

  this._timer = null;
  this._nextArrival = Infinity;

  this._runReadyTasksBound = function () { return this$1._runReadyTasks(this$1.currentTime()); };
};

Scheduler$1.prototype.currentTime = function currentTime () {
  return this.timer.now()
};

Scheduler$1.prototype.scheduleTask = function scheduleTask (localOffset, delay, period, task) {
  var time = this.currentTime() + Math.max(0, delay);
  var st = new ScheduledTask$1(time, localOffset, period, task, this);

  this.timeline.add(st);
  this._scheduleNextRun();
  return st
};

Scheduler$1.prototype.relative = function relative (offset) {
  return new RelativeScheduler$1(offset, this)
};

Scheduler$1.prototype.cancel = function cancel (task) {
  task.active = false;
  if (this.timeline.remove(task)) {
    this._reschedule();
  }
};

Scheduler$1.prototype.cancelAll = function cancelAll (f) {
  this.timeline.removeAll(f);
  this._reschedule();
};

Scheduler$1.prototype._reschedule = function _reschedule () {
  if (this.timeline.isEmpty()) {
    this._unschedule();
  } else {
    this._scheduleNextRun(this.currentTime());
  }
};

Scheduler$1.prototype._unschedule = function _unschedule () {
  this.timer.clearTimer(this._timer);
  this._timer = null;
};

Scheduler$1.prototype._scheduleNextRun = function _scheduleNextRun () { // eslint-disable-line complexity
  if (this.timeline.isEmpty()) {
    return
  }

  var nextArrival = this.timeline.nextArrival();

  if (this._timer === null) {
    this._scheduleNextArrival(nextArrival);
  } else if (nextArrival < this._nextArrival) {
    this._unschedule();
    this._scheduleNextArrival(nextArrival);
  }
};

Scheduler$1.prototype._scheduleNextArrival = function _scheduleNextArrival (nextArrival) {
  this._nextArrival = nextArrival;
  var delay = Math.max(0, nextArrival - this.currentTime());
  this._timer = this.timer.setTimer(this._runReadyTasksBound, delay);
};

Scheduler$1.prototype._runReadyTasks = function _runReadyTasks () {
  this._timer = null;
  this.timeline.runTasks(this.currentTime(), runTask$1);
  this._scheduleNextRun();
};

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var Timeline$1 = function Timeline () {
  this.tasks = [];
};

Timeline$1.prototype.nextArrival = function nextArrival () {
  return this.isEmpty() ? Infinity : this.tasks[0].time
};

Timeline$1.prototype.isEmpty = function isEmpty () {
  return this.tasks.length === 0
};

Timeline$1.prototype.add = function add (st) {
  insertByTime$1(st, this.tasks);
};

Timeline$1.prototype.remove = function remove$$1 (st) {
  var i = binarySearch$1(getTime$1(st), this.tasks);

  if (i >= 0 && i < this.tasks.length) {
    var at = findIndex(st, this.tasks[i].events);
    if (at >= 0) {
      this.tasks[i].events.splice(at, 1);
      return true
    }
  }

  return false
};

Timeline$1.prototype.removeAll = function removeAll$$1 (f) {
    var this$1 = this;

  for (var i = 0; i < this.tasks.length; ++i) {
    removeAllFrom$1(f, this$1.tasks[i]);
  }
};

Timeline$1.prototype.runTasks = function runTasks (t, runTask) {
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
    this$1.tasks = runReadyTasks$1(runTask, tasks[j].events, this$1.tasks);
  }
};

function runReadyTasks$1 (runTask, events, tasks) { // eslint-disable-line complexity
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

function insertByTime$1 (task, timeslots) {
  var l = timeslots.length;
  var time = getTime$1(task);

  if (l === 0) {
    timeslots.push(newTimeslot$1(time, [task]));
    return
  }

  var i = binarySearch$1(time, timeslots);

  if (i >= l) {
    timeslots.push(newTimeslot$1(time, [task]));
  } else {
    insertAtTimeslot$1(task, timeslots, time, i);
  }
}

function insertAtTimeslot$1 (task, timeslots, time, i) {
  var timeslot = timeslots[i];
  if (time === timeslot.time) {
    addEvent$1(task, timeslot.events, time);
  } else {
    timeslots.splice(i, 0, newTimeslot$1(time, [task]));
  }
}

function addEvent$1 (task, events) {
  if (events.length === 0 || task.time >= events[events.length - 1].time) {
    events.push(task);
  } else {
    spliceEvent$1(task, events);
  }
}

function spliceEvent$1 (task, events) {
  for (var j = 0; j < events.length; j++) {
    if (task.time < events[j].time) {
      events.splice(j, 0, task);
      break
    }
  }
}

function getTime$1 (scheduledTask) {
  return Math.floor(scheduledTask.time)
}

function removeAllFrom$1 (f, timeslot) {
  timeslot.events = removeAll(f, timeslot.events);
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

var newTimeslot$1 = function (t, events) { return ({ time: t, events: events }); };

/** @license MIT License (c) copyright 2010-2017 original author or authors */

/* global setTimeout, clearTimeout */

var ClockTimer$1 = function ClockTimer (clock) {
  this._clock = clock;
};

ClockTimer$1.prototype.now = function now () {
  return this._clock.now()
};

ClockTimer$1.prototype.setTimer = function setTimer (f, dt) {
  return dt <= 0 ? runAsap$1(f) : setTimeout(f, dt)
};

ClockTimer$1.prototype.clearTimer = function clearTimer (t) {
  return t instanceof Asap$1 ? t.cancel() : clearTimeout(t)
};

var Asap$1 = function Asap (f) {
  this.f = f;
  this.active = true;
};

Asap$1.prototype.run = function run () {
  return this.active && this.f()
};

Asap$1.prototype.error = function error (e) {
  throw e
};

Asap$1.prototype.cancel = function cancel () {
  this.active = false;
};

function runAsap$1 (f) {
  var task = new Asap$1(f);
  defer$1(task);
  return task
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */

/* global performance, process */

var RelativeClock$1 = function RelativeClock (clock, origin) {
  this.origin = origin;
  this.clock = clock;
};

RelativeClock$1.prototype.now = function now () {
  return this.clock.now() - this.origin
};

var HRTimeClock$1 = function HRTimeClock (hrtime, origin) {
  this.origin = origin;
  this.hrtime = hrtime;
};

HRTimeClock$1.prototype.now = function now () {
  var hrt = this.hrtime(this.origin);
  return (hrt[0] * 1e9 + hrt[1]) / 1e6
};

var clockRelativeTo$1 = function (clock) { return new RelativeClock$1(clock, clock.now()); };

var newPerformanceClock$1 = function () { return clockRelativeTo$1(performance); };

var newDateClock$1 = function () { return clockRelativeTo$1(Date); };

var newHRTimeClock$1 = function () { return new HRTimeClock$1(process.hrtime, process.hrtime()); };

var newPlatformClock$1 = function () {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return newPerformanceClock$1()
  } else if (typeof process !== 'undefined' && typeof process.hrtime === 'function') {
    return newHRTimeClock$1()
  }

  return newDateClock$1()
};

// Read the current time from the provided Scheduler
var currentTime$1 = function (scheduler) { return scheduler.currentTime(); };

var newDefaultScheduler$1 = function () { return new Scheduler$1(newDefaultTimer$1(), new Timeline$1()); };

var newDefaultTimer$1 = function () { return new ClockTimer$1(newPlatformClock$1()); };

/** @license MIT License (c) copyright 2015-2016 original author or authors */
/** @author Brian Cavalier */
// domEvent :: (EventTarget t, Event e) => String -> t -> boolean=false -> Stream e
var domEvent = function (event, node, capture) {
    if ( capture === void 0 ) { capture = false; }

    return new DomEvent(event, node, capture);
};

var click = function (node, capture) {
  if ( capture === void 0 ) { capture = false; }

  return domEvent('click', node, capture);
};
var DomEvent = function DomEvent (event, node, capture) {
  this.event = event;
  this.node = node;
  this.capture = capture;
};

DomEvent.prototype.run = function run (sink, scheduler$$1) {
    var this$1 = this;

  var send = function (e) { return tryEvent$1(currentTime$1(scheduler$$1), e, sink); };
  var dispose = function () { return this$1.node.removeEventListener(this$1.event, send, this$1.capture); };

  this.node.addEventListener(this.event, send, this.capture);

  return { dispose: dispose }
};

function tryEvent$1 (t, x, sink) {
  try {
    sink.event(t, x);
  } catch (e) {
    sink.error(t, e);
  }
}

//      
                                               
// DOM Event helpers
var fail = function (s) { throw new Error(s) };
var qs = function (s) { return document.querySelector(s) || fail((s + " not found")); };

// Each button click is a higher-order event stream carrying a periodic
// event stream representing a sample rate value. The event values are
// all void because they don't matter. What matters is the *rate* at
// which they occur, as that will be used to sample the current elapsed time.
var click10ms                       = constant$$1(periodic$1(10), click(qs('[name="10ms"]')));
var click100ms                       = constant$$1(periodic$1(100), click(qs('[name="100ms"]')));
var click1s                       = constant$$1(periodic$1(1000), click(qs('[name="1s"]')));

var clicks                       = mergeArray([click10ms, click100ms, click1s]);

// Each time a button is clicked, switch to its associated sampling rate.
// Start the app with one second sampling rate, i.e., before any buttons
// have been clicked.
var sampler               = switchLatest(startWith$$1(periodic$1(1000), clicks));

// Get the elapsed time by sampling time() at the associated rate each
// time a button is clicked.
var elapsed               = sample(time(), sampler);

// Render output
var render = function (el) { return function (ms) { return el.innerText = ((ms / 1000).toFixed(3)) + " seconds"; }; };

// We'll put the clock here
var el = qs('#app');

// Sample time at some interval and display it
runEffects$$1(tap$$1(render(el), elapsed), newDefaultScheduler$1());

}());
