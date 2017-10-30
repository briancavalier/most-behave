(function () {
'use strict';

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// Non-mutating array operations

// cons :: a -> [a] -> [a]
// a with x prepended
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

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// id :: a -> a
var id = function (x) { return x; };

// compose :: (b -> c) -> (a -> b) -> (a -> c)
var compose = function (f, g) { return function (x) { return f(g(x)); }; };

// apply :: (a -> b) -> a -> b
var apply$1 = function (f, x) { return f(x); };

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

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var ScheduledTask = function ScheduledTask (time, localOffset, period, task, scheduler) {
  this.time = time;
  this.localOffset = localOffset;
  this.period = period;
  this.task = task;
  this.scheduler = scheduler;
  this.active = true;
};

ScheduledTask.prototype.run = function run () {
  return this.task.run(this.time - this.localOffset)
};

ScheduledTask.prototype.error = function error (e) {
  return this.task.error(this.time - this.localOffset, e)
};

ScheduledTask.prototype.dispose = function dispose () {
  this.scheduler.cancel(this);
  return this.task.dispose()
};

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

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var defer = function (task) { return Promise.resolve(task).then(runTask); };

function runTask (task) {
  try {
    return task.run()
  } catch (e) {
    return task.error(e)
  }
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var Scheduler = function Scheduler (timer, timeline) {
  var this$1 = this;

  this.timer = timer;
  this.timeline = timeline;

  this._timer = null;
  this._nextArrival = Infinity;

  this._runReadyTasksBound = function () { return this$1._runReadyTasks(this$1.currentTime()); };
};

Scheduler.prototype.currentTime = function currentTime () {
  return this.timer.now()
};

Scheduler.prototype.scheduleTask = function scheduleTask (localOffset, delay, period, task) {
  var time = this.currentTime() + Math.max(0, delay);
  var st = new ScheduledTask(time, localOffset, period, task, this);

  this.timeline.add(st);
  this._scheduleNextRun();
  return st
};

Scheduler.prototype.relative = function relative (offset) {
  return new RelativeScheduler(offset, this)
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
    this._scheduleNextRun(this.currentTime());
  }
};

Scheduler.prototype._unschedule = function _unschedule () {
  this.timer.clearTimer(this._timer);
  this._timer = null;
};

Scheduler.prototype._scheduleNextRun = function _scheduleNextRun () { // eslint-disable-line complexity
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

Scheduler.prototype._scheduleNextArrival = function _scheduleNextArrival (nextArrival) {
  this._nextArrival = nextArrival;
  var delay = Math.max(0, nextArrival - this.currentTime());
  this._timer = this.timer.setTimer(this._runReadyTasksBound, delay);
};

Scheduler.prototype._runReadyTasks = function _runReadyTasks () {
  this._timer = null;
  this.timeline.runTasks(this.currentTime(), runTask);
  this._scheduleNextRun();
};

/** @license MIT License (c) copyright 2010-2017 original author or authors */

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
  var i = binarySearch(getTime(st), this.tasks);

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

function insertByTime (task, timeslots) {
  var l = timeslots.length;
  var time = getTime(task);

  if (l === 0) {
    timeslots.push(newTimeslot(time, [task]));
    return
  }

  var i = binarySearch(time, timeslots);

  if (i >= l) {
    timeslots.push(newTimeslot(time, [task]));
  } else {
    insertAtTimeslot(task, timeslots, time, i);
  }
}

function insertAtTimeslot (task, timeslots, time, i) {
  var timeslot = timeslots[i];
  if (time === timeslot.time) {
    addEvent(task, timeslot.events, time);
  } else {
    timeslots.splice(i, 0, newTimeslot(time, [task]));
  }
}

function addEvent (task, events) {
  if (events.length === 0 || task.time >= events[events.length - 1].time) {
    events.push(task);
  } else {
    spliceEvent(task, events);
  }
}

function spliceEvent (task, events) {
  for (var j = 0; j < events.length; j++) {
    if (task.time < events[j].time) {
      events.splice(j, 0, task);
      break
    }
  }
}

function getTime (scheduledTask) {
  return Math.floor(scheduledTask.time)
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

/** @license MIT License (c) copyright 2010-2017 original author or authors */

/* global setTimeout, clearTimeout */

var ClockTimer = function ClockTimer (clock) {
  this._clock = clock;
};

ClockTimer.prototype.now = function now () {
  return this._clock.now()
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

Asap.prototype.error = function error (e) {
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

/** @license MIT License (c) copyright 2010-2017 original author or authors */

/* global performance, process */

var RelativeClock = function RelativeClock (clock, origin) {
  this.origin = origin;
  this.clock = clock;
};

RelativeClock.prototype.now = function now () {
  return this.clock.now() - this.origin
};

var HRTimeClock = function HRTimeClock (hrtime, origin) {
  this.origin = origin;
  this.hrtime = hrtime;
};

HRTimeClock.prototype.now = function now () {
  var hrt = this.hrtime(this.origin);
  return (hrt[0] * 1e9 + hrt[1]) / 1e6
};

var clockRelativeTo = function (clock) { return new RelativeClock(clock, clock.now()); };

var newPerformanceClock = function () { return clockRelativeTo(performance); };

var newDateClock = function () { return clockRelativeTo(Date); };

var newHRTimeClock = function () { return new HRTimeClock(process.hrtime, process.hrtime()); };

var newPlatformClock = function () {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return newPerformanceClock()
  } else if (typeof process !== 'undefined' && typeof process.hrtime === 'function') {
    return newHRTimeClock()
  }

  return newDateClock()
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

var newScheduler = curry2(function (timer, timeline) { return new Scheduler(timer, timeline); });

var newDefaultScheduler = function () { return new Scheduler(newDefaultTimer(), new Timeline()); };

var newDefaultTimer = function () { return new ClockTimer(newPlatformClock()); };

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var disposeNone = function () { return NONE; };
var NONE = new ((function () {
  function DisposeNone () {}

  DisposeNone.prototype.dispose = function dispose () {};

  return DisposeNone;
}()))();

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
// Create a Disposable that will use the provided
// dispose function to dispose the resource
var disposeWith = curry2(function (dispose, resource) { return disposeOnce(new DisposeWith(dispose, resource)); });

// Disposable represents a resource that must be
// disposed/released. It aggregates a function to dispose
// the resource and a handle to a key/id/handle/reference
// that identifies the resource
var DisposeWith = function DisposeWith (dispose, resource) {
  this._dispose = dispose;
  this._resource = resource;
};

DisposeWith.prototype.dispose = function dispose () {
  this._dispose(this._resource);
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

var propagateErrorTask$1 = function (value, sink) { return propagateTask$1(runError, value, sink); };

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

var runError = function (t, e, sink) { return sink.error(t, e); };

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var empty = function () { return EMPTY; };

var isCanonicalEmpty = function (stream) { return stream === EMPTY; };

var Empty = function Empty () {};

Empty.prototype.run = function run (sink, scheduler) {
  return asap(propagateEndTask(sink), scheduler)
};

var EMPTY = new Empty();

var Never = function Never () {};

Never.prototype.run = function run () {
  return disposeNone()
};

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var at = function (t, x) { return new At(t, x); };

var At = function At (t, x) {
  this.time = t;
  this.value = x;
};

At.prototype.run = function run (sink, scheduler) {
  return delay(this.time, propagateTask$1(runAt, this.value, sink), scheduler)
};

function runAt (t, x, sink) {
  sink.event(t, x);
  sink.end(t);
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var now = function (x) { return at(0, x); };

var Periodic = function Periodic (period) {
  this.period = period;
};

Periodic.prototype.run = function run (sink, scheduler) {
  return periodic(this.period, propagateEventTask$1(undefined, sink), scheduler)
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

Filter.prototype.run = function run (sink, scheduler) {
  return this.source.run(new FilterSink(this.p, sink), scheduler)
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

FilterMap.prototype.run = function run (sink, scheduler) {
  return this.source.run(new FilterMapSink(this.p, this.f, sink), scheduler)
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

Map.prototype.run = function run (sink, scheduler) { // eslint-disable-line no-extend-native
  return this.source.run(new MapSink(this.f, sink), scheduler)
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

SettableDisposable.prototype.setDisposable = function setDisposable (disposable) {
  if (this.disposable !== void 0) {
    throw new Error('setDisposable called more than once')
  }

  this.disposable = disposable;

  if (this.disposed) {
    disposable.dispose();
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

/** @license MIT License (c) copyright 2010 original author or authors */

/**
 * @param {number} n
 * @param {Stream} stream
 * @returns {Stream} new stream containing only up to the first n items from stream
 */
var take$1 = function (n, stream) { return slice$1(0, n, stream); };

/**
 * @param {number} n
 * @param {Stream} stream
 * @returns {Stream} new stream with the first n items removed
 */
var skip$1 = function (n, stream) { return slice$1(n, Infinity, stream); };

/**
 * Slice a stream by index. Negative start/end indexes are not supported
 * @param {number} start
 * @param {number} end
 * @param {Stream} stream
 * @returns {Stream} stream containing items where start <= index < end
 */
var slice$1 = function (start, end, stream) { return end <= start || isCanonicalEmpty(stream)
    ? empty()
    : sliceSource(start, end, stream); };

var sliceSource = function (start, end, stream) { return stream instanceof Map ? commuteMapSlice(start, end, stream)
    : stream instanceof Slice ? fuseSlice(start, end, stream)
    : new Slice(start, end, stream); };

var commuteMapSlice = function (start, end, mapStream) { return Map.create(mapStream.f, slice$1(start, end, mapStream.source)); };

function fuseSlice (start, end, sliceStream) {
  var fusedStart = start + sliceStream.min;
  var fusedEnd = Math.min(end + sliceStream.min, sliceStream.max);
  return slice$1(fusedStart, fusedEnd, sliceStream.source)
}

var Slice = function Slice (min, max, source) {
  this.source = source;
  this.min = min;
  this.max = max;
};

Slice.prototype.run = function run (sink, scheduler) {
  var disposable = new SettableDisposable();
  var sliceSink = new SliceSink(this.min, this.max - this.min, sink, disposable);

  disposable.setDisposable(this.source.run(sliceSink, scheduler));

  return disposable
};

var SliceSink = (function (Pipe$$1) {
  function SliceSink (skip, take, sink, disposable) {
    Pipe$$1.call(this, sink);
    this.skip = skip;
    this.take = take;
    this.disposable = disposable;
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

var takeWhile$1 = function (p, stream) { return new TakeWhile(p, stream); };

var TakeWhile = function TakeWhile (p, source) {
  this.p = p;
  this.source = source;
};

TakeWhile.prototype.run = function run (sink, scheduler) {
  var disposable = new SettableDisposable();
  var takeWhileSink = new TakeWhileSink(this.p, sink, disposable);

  disposable.setDisposable(this.source.run(takeWhileSink, scheduler));

  return disposable
};

var TakeWhileSink = (function (Pipe$$1) {
  function TakeWhileSink (p, sink, disposable) {
    Pipe$$1.call(this, sink);
    this.p = p;
    this.active = true;
    this.disposable = disposable;
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

var skipWhile$1 = function (p, stream) { return new SkipWhile(p, stream); };

var SkipWhile = function SkipWhile (p, source) {
  this.p = p;
  this.source = source;
};

SkipWhile.prototype.run = function run (sink, scheduler) {
  return this.source.run(new SkipWhileSink(this.p, sink), scheduler)
};

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

var skipAfter$1 = function (p, stream) { return new SkipAfter(p, stream); };

var SkipAfter = function SkipAfter (p, source) {
  this.p = p;
  this.source = source;
};

SkipAfter.prototype.run = function run (sink, scheduler) {
  return this.source.run(new SkipAfterSink(this.p, sink), scheduler)
};

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

/** @license MIT License (c) copyright 2017 original author or authors */

var withItems$1 = function (items, stream) { return zipItems$1(keepLeft, items, stream); };

var zipItems$1 = function (f, items, stream) { return isCanonicalEmpty(stream) || items.length === 0
    ? empty()
    : new ZipItems(f, items, take$1(items.length, stream)); };

var keepLeft = function (a, _) { return a; };

var ZipItems = function ZipItems (f, items, source) {
  this.f = f;
  this.items = items;
  this.source = source;
};

ZipItems.prototype.run = function run (sink, scheduler) {
  return this.source.run(new ZipItemsSink(this.f, this.items, sink), scheduler)
};

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

var runEffects$1 = curry2(function (stream, scheduler) { return new Promise(function (resolve, reject) { return runStream(stream, scheduler, resolve, reject); }); });

function runStream (stream, scheduler, resolve, reject) {
  var disposable = new SettableDisposable();
  var observer = new RunEffectsSink(resolve, reject, disposable);

  disposable.setDisposable(stream.run(observer, scheduler));
}

var RunEffectsSink = function RunEffectsSink (end, error, disposable) {
  this._end = end;
  this._error = error;
  this._disposable = disposable;
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

function tryDispose$1 (error, end, x, disposable) {
  try {
    disposable.dispose();
  } catch (e) {
    error(e);
    return
  }

  end(x);
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */

// Run a Stream, sending all its events to the
// provided Sink.
var run$1 = function (sink, scheduler, stream) { return stream.run(sink, scheduler); };

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

WithLocalTime.prototype.run = function run (sink, scheduler) {
  return this.source.run(relativeSink(this.origin, sink), schedulerRelativeTo(this.origin, scheduler))
};

// Accumulate offsets instead of nesting RelativeSinks, which can happen
// with higher-order stream and combinators like continueWith when they're
// applied recursively.
var relativeSink = function (origin, sink) { return sink instanceof RelativeSink
    ? new RelativeSink(origin + sink.offset, sink.sink)
    : new RelativeSink(origin, sink); };

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
var loop$1 = function (stepper, seed, stream) { return new Loop(stepper, seed, stream); };

var Loop = function Loop (stepper, seed, source) {
  this.step = stepper;
  this.seed = seed;
  this.source = source;
};

Loop.prototype.run = function run (sink, scheduler) {
  return this.source.run(new LoopSink(this.step, this.seed, sink), scheduler)
};

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
var scan$1 = function (f, initial, stream) { return new Scan(f, initial, stream); };

var Scan = function Scan (f, z, source) {
  this.source = source;
  this.f = f;
  this.value = z;
};

Scan.prototype.run = function run (sink, scheduler) {
  var d1 = asap(propagateEventTask$1(this.value, sink), scheduler);
  var d2 = this.source.run(new ScanSink(this.f, this.value, sink), scheduler);
  return disposeBoth(d1, d2)
};

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

ContinueWith.prototype.run = function run (sink, scheduler) {
  return new ContinueWithSink(this.f, this.source, sink, scheduler)
};

var ContinueWithSink = (function (Pipe$$1) {
  function ContinueWithSink (f, source, sink, scheduler) {
    Pipe$$1.call(this, sink);
    this.f = f;
    this.scheduler = scheduler;
    this.active = true;
    this.disposable = disposeOnce(source.run(this, scheduler));
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

Tap.prototype.run = function run (sink, scheduler) {
  return this.source.run(new TapSink(this.f, sink), scheduler)
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

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Combine latest events from two streams
 * @param {function(...events):*} f function to combine most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */
function combine$1 (f, stream1, stream2) {
  return combineArray$1(f, [stream1, stream2])
}

/**
* Combine latest events from all input streams
* @param {function(...events):*} f function to combine most recent events
* @param {[Stream]} streams most recent events
* @returns {Stream} stream containing the result of applying f to the most recent
*  event of each input stream, whenever a new event arrives on any stream.
*/
var combineArray$1 = function (f, streams) { return streams.length === 0 ? empty()
    : streams.length === 1 ? map$2(f, streams[0])
    : new Combine(f, streams); };

var Combine = function Combine (f, sources) {
  this.f = f;
  this.sources = sources;
};

Combine.prototype.run = function run (sink, scheduler) {
    var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l);
  var sinks = new Array(l);

  var mergeSink = new CombineSink(disposables, sinks, sink, this.f);

  for (var indexSink = (void 0), i = 0; i < l; ++i) {
    indexSink = sinks[i] = new IndexSink(i, mergeSink);
    disposables[i] = this$1.sources[i].run(indexSink, scheduler);
  }

  return disposeAll(disposables)
};

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
function ap$1 (fs, xs) {
  return combine$1(apply$1, fs, xs)
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Doubly linked list
 * @constructor
 */
var LinkedList = function LinkedList () {
  this.head = null;
  this.length = 0;
};

/**
 * Add a node to the end of the list
 * @param {{prev:Object|null, next:Object|null, dispose:function}} x node to add
 */
LinkedList.prototype.add = function add (x) {
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
LinkedList.prototype.remove = function remove$$1 (x) { // eslint-disable-linecomplexity
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
LinkedList.prototype.isEmpty = function isEmpty () {
  return this.length === 0
};

/**
 * Dispose all nodes
 * @returns {Promise} promise that fulfills when all nodes have been disposed,
 *or rejects if an error occurs while disposing
 */
LinkedList.prototype.dispose = function dispose$$1 () {
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

var mergeConcurrently$1 = function (concurrency, stream) { return mergeMapConcurrently$1(id, concurrency, stream); };

var mergeMapConcurrently$1 = function (f, concurrency, stream) { return new MergeConcurrently(f, concurrency, stream); };

var MergeConcurrently = function MergeConcurrently (f, concurrency, source) {
  this.f = f;
  this.concurrency = concurrency;
  this.source = source;
};

MergeConcurrently.prototype.run = function run (sink, scheduler) {
  return new Outer(this.f, this.concurrency, this.source, sink, scheduler)
};

var Outer = function Outer (f, concurrency, source, sink, scheduler) {
  this.f = f;
  this.concurrency = concurrency;
  this.sink = sink;
  this.scheduler = scheduler;
  this.pending = [];
  this.current = new LinkedList();
  this.disposable = disposeOnce(source.run(this, scheduler));
  this.active = true;
};

Outer.prototype.event = function event (t, x) {
  this._addInner(t, x);
};

Outer.prototype._addInner = function _addInner (t, x) {
  if (this.current.length < this.concurrency) {
    this._startInner(t, x);
  } else {
    this.pending.push(x);
  }
};

Outer.prototype._startInner = function _startInner (t, x) {
  try {
    this._initInner(t, x);
  } catch (e) {
    this.error(t, e);
  }
};

Outer.prototype._initInner = function _initInner (t, x) {
  var innerSink = new Inner(t, this, this.sink);
  innerSink.disposable = mapAndRun(this.f, t, x, innerSink, this.scheduler);
  this.current.add(innerSink);
};

Outer.prototype.end = function end (t) {
  this.active = false;
  tryDispose(t, this.disposable, this.sink);
  this._checkEnd(t);
};

Outer.prototype.error = function error (t, e) {
  this.active = false;
  this.sink.error(t, e);
};

Outer.prototype.dispose = function dispose$$1 () {
  this.active = false;
  this.pending.length = 0;
  this.disposable.dispose();
  this.current.dispose();
};

Outer.prototype._endInner = function _endInner (t, inner) {
  this.current.remove(inner);
  tryDispose(t, inner, this);

  if (this.pending.length === 0) {
    this._checkEnd(t);
  } else {
    this._startInner(t, this.pending.shift());
  }
};

Outer.prototype._checkEnd = function _checkEnd (t) {
  if (!this.active && this.current.isEmpty()) {
    this.sink.end(t);
  }
};

var mapAndRun = function (f, t, x, sink, scheduler) { return f(x).run(sink, schedulerRelativeTo(t, scheduler)); };

var Inner = function Inner (time, outer, sink) {
  this.prev = this.next = null;
  this.time = time;
  this.outer = outer;
  this.sink = sink;
  this.disposable = void 0;
};

Inner.prototype.event = function event (t, x) {
  this.sink.event(t + this.time, x);
};

Inner.prototype.end = function end (t) {
  this.outer._endInner(t + this.time, this);
};

Inner.prototype.error = function error (t, e) {
  this.outer.error(t + this.time, e);
};

Inner.prototype.dispose = function dispose$$1 () {
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
var chain$1 = function (f, stream) { return mergeMapConcurrently$1(f, Infinity, stream); };

/**
 * Monadic join. Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer. Event arrival times are preserved.
 * @param {Stream<Stream<X>>} stream stream of streams
 * @returns {Stream<X>} new stream containing all events of all inner streams
 */
var join = function (stream) { return mergeConcurrently$1(Infinity, stream); };

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
var concatMap$1 = function (f, stream) { return mergeMapConcurrently$1(f, 1, stream); };

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * @returns {Stream} stream containing events from two streams in time order.
 * If two events are simultaneous they will be merged in arbitrary order.
 */
function merge$1 (stream1, stream2) {
  return mergeArray([stream1, stream2])
}

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

Merge.prototype.run = function run (sink, scheduler) {
    var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l);
  var sinks = new Array(l);

  var mergeSink = new MergeSink(disposables, sinks, sink);

  for (var indexSink = (void 0), i = 0; i < l; ++i) {
    indexSink = sinks[i] = new IndexSink(i, mergeSink);
    disposables[i] = this$1.sources[i].run(indexSink, scheduler);
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

/** @license MIT License (c) copyright 2010 original author or authors */

var sample$1 = function (values, sampler) { return snapshot$1(function (_, x) { return x; }, values, sampler); };

var snapshot$1 = function (f, values, sampler) { return new Snapshot(f, values, sampler); };

var Snapshot = function Snapshot (f, values, sampler) {
  this.f = f;
  this.values = values;
  this.sampler = sampler;
};

Snapshot.prototype.run = function run (sink, scheduler) {
  var sampleSink = new SnapshotSink(this.f, sink);
  var valuesDisposable = this.values.run(sampleSink.latest, scheduler);
  var samplerDisposable = this.sampler.run(sampleSink, scheduler);

  return disposeBoth(samplerDisposable, valuesDisposable)
};

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

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

// Based on https://github.com/petkaantonov/deque

var Queue = function Queue (capPow2) {
  if ( capPow2 === void 0 ) { capPow2 = 32; }

  this._capacity = capPow2;
  this._length = 0;
  this._head = 0;
};

Queue.prototype.push = function push (x) {
  var len = this._length;
  this._checkCapacity(len + 1);

  var i = (this._head + len) & (this._capacity - 1);
  this[i] = x;
  this._length = len + 1;
};

Queue.prototype.shift = function shift () {
  var head = this._head;
  var x = this[head];

  this[head] = void 0;
  this._head = (head + 1) & (this._capacity - 1);
  this._length--;
  return x
};

Queue.prototype.isEmpty = function isEmpty () {
  return this._length === 0
};

Queue.prototype.length = function length () {
  return this._length
};

Queue.prototype._checkCapacity = function _checkCapacity (size) {
  if (this._capacity < size) {
    this._ensureCapacity(this._capacity << 1);
  }
};

Queue.prototype._ensureCapacity = function _ensureCapacity (capacity) {
  var oldCapacity = this._capacity;
  this._capacity = capacity;

  var last = this._head + this._length;

  if (last > oldCapacity) {
    copy(this, 0, this, oldCapacity, last & (oldCapacity - 1));
  }
};

function copy (src, srcIndex, dst, dstIndex, len) {
  for (var j = 0; j < len; ++j) {
    dst[j + dstIndex] = src[j + srcIndex];
    src[j + srcIndex] = void 0;
  }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Combine two streams pairwise by index by applying f to values at corresponding
 * indices.  The returned stream ends when either of the input streams ends.
 * @param {function} f function to combine values
 * @returns {Stream} new stream with items at corresponding indices combined
 *  using f
 */
function zip$1 (f, stream1, stream2) {
  return zipArray$1(f, [stream1, stream2])
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
var zipArray$1 = function (f, streams) { return streams.length === 0 ? empty()
    : streams.length === 1 ? map$2(f, streams[0])
    : new Zip(f, streams); };

var Zip = function Zip (f, sources) {
  this.f = f;
  this.sources = sources;
};

Zip.prototype.run = function run (sink, scheduler) {
    var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l);
  var sinks = new Array(l);
  var buffers = new Array(l);

  var zipSink = new ZipSink(this.f, buffers, sinks, sink);

  for (var indexSink = (void 0), i = 0; i < l; ++i) {
    buffers[i] = new Queue();
    indexSink = sinks[i] = new IndexSink(i, zipSink);
    disposables[i] = this$1.sources[i].run(indexSink, scheduler);
  }

  return disposeAll(disposables)
};

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

var Switch = function Switch (source) {
  this.source = source;
};

Switch.prototype.run = function run (sink, scheduler) {
  var switchSink = new SwitchSink(sink, scheduler);
  return disposeBoth(switchSink, this.source.run(switchSink, scheduler))
};

var SwitchSink = function SwitchSink (sink, scheduler) {
  this.sink = sink;
  this.scheduler = scheduler;
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

var Segment = function Segment (source, min, max, outer, sink, scheduler) {
  this.min = min;
  this.max = max;
  this.outer = outer;
  this.sink = sink;
  this.disposable = source.run(this, schedulerRelativeTo(min, scheduler));
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

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Retain only items matching a predicate
 * @param {function(x:*):boolean} p filtering predicate called for each item
 * @param {Stream} stream stream to filter
 * @returns {Stream} stream containing only items for which predicate returns truthy
 */
var filter$1 = function (p, stream) { return Filter.create(p, stream); };

/**
 * Skip repeated events using the provided equals function to detect duplicates
 * @param {function(a:*, b:*):boolean} equals optional function to compare items
 * @param {Stream} stream stream from which to omit repeated events
 * @returns {Stream} stream without repeated events
 */
var skipRepeatsWith$1 = function (equals, stream) { return new SkipRepeats(equals, stream); };

var SkipRepeats = function SkipRepeats (equals, source) {
  this.equals = equals;
  this.source = source;
};

SkipRepeats.prototype.run = function run (sink, scheduler) {
  return this.source.run(new SkipRepeatsSink(this.equals, sink), scheduler)
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

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var until$1 = function (signal, stream) { return new Until(signal, stream); };

var since$1 = function (signal, stream) { return new Since(signal, stream); };

var during$1 = function (timeWindow, stream) { return until$1(join(timeWindow), since$1(timeWindow, stream)); };

var Until = function Until (maxSignal, source) {
  this.maxSignal = maxSignal;
  this.source = source;
};

Until.prototype.run = function run (sink, scheduler) {
  var min = new Bound(-Infinity, sink);
  var max = new UpperBound(this.maxSignal, sink, scheduler);
  var disposable = this.source.run(new TimeWindowSink(min, max, sink), scheduler);

  return disposeAll([min, max, disposable])
};

var Since = function Since (minSignal, source) {
  this.minSignal = minSignal;
  this.source = source;
};

Since.prototype.run = function run (sink, scheduler) {
  var min = new LowerBound(this.minSignal, sink, scheduler);
  var max = new Bound(Infinity, sink);
  var disposable = this.source.run(new TimeWindowSink(min, max, sink), scheduler);

  return disposeAll([min, max, disposable])
};

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
  function LowerBound (signal, sink, scheduler) {
    Pipe$$1.call(this, sink);
    this.value = Infinity;
    this.disposable = signal.run(this, scheduler);
  }

  if ( Pipe$$1 ) { LowerBound.__proto__ = Pipe$$1; }
  LowerBound.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  LowerBound.prototype.constructor = LowerBound;

  LowerBound.prototype.event = function event (t /*, x */) {
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
  function UpperBound (signal, sink, scheduler) {
    Pipe$$1.call(this, sink);
    this.value = Infinity;
    this.disposable = signal.run(this, scheduler);
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

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * @param {Number} delayTime milliseconds to delay each item
 * @param {Stream} stream
 * @returns {Stream} new stream containing the same items, but delayed by ms
 */
var delay$2 = function (delayTime, stream) { return delayTime <= 0 ? stream : new Delay(delayTime, stream); };

var Delay = function Delay (dt, source) {
  this.dt = dt;
  this.source = source;
};

Delay.prototype.run = function run (sink, scheduler) {
  var delaySink = new DelaySink(this.dt, sink, scheduler);
  return disposeBoth(delaySink, this.source.run(delaySink, scheduler))
};

var DelaySink = (function (Pipe$$1) {
  function DelaySink (dt, sink, scheduler) {
    Pipe$$1.call(this, sink);
    this.dt = dt;
    this.scheduler = scheduler;
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

/** @license MIT License (c) copyright 2010-2017 original author or authors */

/**
 * Limit the rate of events by suppressing events that occur too often
 * @param {Number} period time to suppress events
 * @param {Stream} stream
 * @returns {Stream}
 */
var throttle$1 = function (period, stream) { return stream instanceof Map ? commuteMapThrottle(period, stream)
    : stream instanceof Throttle ? fuseThrottle(period, stream)
    : new Throttle(period, stream); };

var commuteMapThrottle = function (period, mapStream) { return Map.create(mapStream.f, throttle$1(period, mapStream.source)); };

var fuseThrottle = function (period, throttleStream) { return new Throttle(Math.max(period, throttleStream.period), throttleStream.source); };

var Throttle = function Throttle (period, source) {
  this.period = period;
  this.source = source;
};

Throttle.prototype.run = function run (sink, scheduler) {
  return this.source.run(new ThrottleSink(this.period, sink), scheduler)
};

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
/**
 * Wait for a burst of events to subside and emit only the last event in the burst
 * @param {Number} period events occuring more frequently than this
 *  will be suppressed
 * @param {Stream} stream stream to debounce
 * @returns {Stream} new debounced stream
 */
var debounce$1 = function (period, stream) { return new Debounce(period, stream); };

var Debounce = function Debounce (dt, source) {
  this.dt = dt;
  this.source = source;
};

Debounce.prototype.run = function run (sink, scheduler) {
  return new DebounceSink(this.dt, this.source, sink, scheduler)
};

var DebounceSink = function DebounceSink (dt, source, sink, scheduler) {
  this.dt = dt;
  this.sink = sink;
  this.scheduler = scheduler;
  this.value = void 0;
  this.timer = null;

  this.disposable = source.run(this, scheduler);
};

DebounceSink.prototype.event = function event (t, x) {
  this._clearTimer();
  this.value = x;
  this.timer = delay(this.dt, propagateEventTask$1(x, this.sink), this.scheduler);
};

DebounceSink.prototype.end = function end (t) {
  if (this._clearTimer()) {
    this.sink.event(t, this.value);
    this.value = undefined;
  }
  this.sink.end(t);
};

DebounceSink.prototype.error = function error (t, x) {
  this._clearTimer();
  this.sink.error(t, x);
};

DebounceSink.prototype.dispose = function dispose$$1 () {
  this._clearTimer();
  this.disposable.dispose();
};

DebounceSink.prototype._clearTimer = function _clearTimer () {
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
 * Turn a Stream<Promise<T>> into Stream<T> by awaiting each promise.
 * Event order is preserved. The stream will fail if any promise rejects.
 */
var awaitPromises = function (stream) { return new Await(stream); };

/**
 * Create a stream containing only the promise's fulfillment
 * value at the time it fulfills.
 * @param {Promise<T>} p promise
 * @return {Stream<T>} stream containing promise's fulfillment value.
 *  If the promise rejects, the stream will error
 */
var fromPromise = compose(awaitPromises, now);

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
  this._eventBound = function (x) { return this$1.sink.event(currentTime(this$1.scheduler), x); };
  this._endBound = function () { return this$1.sink.end(currentTime(this$1.scheduler)); };
  this._errorBound = function (e) { return this$1.sink.error(currentTime(this$1.scheduler), e); };
};

AwaitSink.prototype.event = function event (t, promise) {
    var this$1 = this;

  this.queue = this.queue.then(function () { return this$1._event(promise); })
    .catch(this._errorBound);
};

AwaitSink.prototype.end = function end (t) {
  this.queue = this.queue.then(this._endBound)
    .catch(this._errorBound);
};

AwaitSink.prototype.error = function error (t, e) {
    var this$1 = this;

  // Don't resolve error values, propagate directly
  this.queue = this.queue.then(function () { return this$1._errorBound(e); })
    .catch(fatalError);
};

AwaitSink.prototype._event = function _event (promise) {
  return promise.then(this._eventBound)
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var SafeSink = function SafeSink (sink) {
  this.sink = sink;
  this.active = true;
};

SafeSink.prototype.event = function event (t, x) {
  if (!this.active) {
    return
  }
  this.sink.event(t, x);
};

SafeSink.prototype.end = function end (t, x) {
  if (!this.active) {
    return
  }
  this.disable();
  this.sink.end(t, x);
};

SafeSink.prototype.error = function error (t, e) {
  this.disable();
  this.sink.error(t, e);
};

SafeSink.prototype.disable = function disable () {
  this.active = false;
  return this.sink
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function tryEvent (t, x, sink) {
  try {
    sink.event(t, x);
  } catch (e) {
    sink.error(t, e);
  }
}

function tryEnd (t, sink) {
  try {
    sink.end(t);
  } catch (e) {
    sink.error(t, e);
  }
}

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
var recoverWith$1 = function (f, stream) { return new RecoverWith(f, stream); };

var ErrorStream = function ErrorStream (e) {
  this.value = e;
};

ErrorStream.prototype.run = function run (sink, scheduler) {
  return asap(propagateErrorTask$1(this.value, sink), scheduler)
};

var RecoverWith = function RecoverWith (f, source) {
  this.f = f;
  this.source = source;
};

RecoverWith.prototype.run = function run (sink, scheduler) {
  return new RecoverWithSink(this.f, this.source, sink, scheduler)
};

var RecoverWithSink = function RecoverWithSink (f, source, sink, scheduler) {
  this.f = f;
  this.sink = new SafeSink(sink);
  this.scheduler = scheduler;
  this.disposable = source.run(this, scheduler);
};

RecoverWithSink.prototype.event = function event (t, x) {
  tryEvent(t, x, this.sink);
};

RecoverWithSink.prototype.end = function end (t) {
  tryEnd(t, this.sink);
};

RecoverWithSink.prototype.error = function error (t, e) {
  var nextSink = this.sink.disable();

  tryDispose(t, this.disposable, this.sink);

  this._startNext(t, e, nextSink);
};

RecoverWithSink.prototype._startNext = function _startNext (t, x, sink) {
  try {
    this.disposable = this._continue(this.f, t, x, sink);
  } catch (e) {
    sink.error(t, e);
  }
};

RecoverWithSink.prototype._continue = function _continue (f, t, x, sink) {
  return run$1(sink, this.scheduler, withLocalTime$1(t, f(x)))
};

RecoverWithSink.prototype.dispose = function dispose$$1 () {
  return this.disposable.dispose()
};

var multicast = function (stream) { return stream instanceof Multicast ? stream : new Multicast(stream); };

var Multicast = function Multicast (source) {
  this.source = new MulticastSource(source);
};
Multicast.prototype.run = function run (sink, scheduler) {
  return this.source.run(sink, scheduler)
};

var MulticastSource = function MulticastSource (source) {
  this.source = source;
  this.sinks = [];
  this.disposable = disposeNone();
};

MulticastSource.prototype.run = function run (sink, scheduler) {
  var n = this.add(sink);
  if (n === 1) {
    this.disposable = this.source.run(this, scheduler);
  }
  return disposeOnce(new MulticastDisposable(this, sink))
};

MulticastSource.prototype.dispose = function dispose$$1 () {
  var disposable = this.disposable;
  this.disposable = disposeNone();
  return disposable.dispose()
};

MulticastSource.prototype.add = function add (sink) {
  this.sinks = append(sink, this.sinks);
  return this.sinks.length
};

MulticastSource.prototype.remove = function remove$1 (sink) {
  var i = findIndex(sink, this.sinks);
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
    tryEvent(time, value, s[i]);
  }
};

MulticastSource.prototype.end = function end (time) {
  var s = this.sinks;
  for (var i = 0; i < s.length; ++i) {
    tryEnd(time, s[i]);
  }
};

MulticastSource.prototype.error = function error (time, err) {
  var s = this.sinks;
  for (var i = 0; i < s.length; ++i) {
    s[i].error(time, err);
  }
};

var MulticastDisposable = function MulticastDisposable (source, sink) {
  this.source = source;
  this.sink = sink;
};

MulticastDisposable.prototype.dispose = function dispose$$1 () {
  if (this.source.remove(this.sink) === 0) {
    this.source.dispose();
  }
};

/** @license MIT License (c) copyright 2016 original author or authors */
/* eslint-disable import/first */
var zipItems = curry3(zipItems$1);
var withItems = curry2(withItems$1);

// -----------------------------------------------------------------------
// Observing

var runEffects = curry2(runEffects$1);
var run = curry3(run$1);

// -------------------------------------------------------

var withLocalTime = curry2(withLocalTime$1);

// -------------------------------------------------------

var loop = curry3(loop$1);

// -------------------------------------------------------

var scan = curry3(scan$1);

// -----------------------------------------------------------------------
// Extending

var startWith = curry2(startWith$1);

// -----------------------------------------------------------------------
// Transforming

var map$1 = curry2(map$2);
var constant = curry2(constant$1);
var tap = curry2(tap$1);
var ap = curry2(ap$1);

// -----------------------------------------------------------------------
// FlatMapping

var chain = curry2(chain$1);
var continueWith = curry2(continueWith$1);

var concatMap = curry2(concatMap$1);

// -----------------------------------------------------------------------
// Concurrent merging

var mergeConcurrently = curry2(mergeConcurrently$1);
var mergeMapConcurrently = curry3(mergeMapConcurrently$1);

// -----------------------------------------------------------------------
// Merging

var merge = curry2(merge$1);
// -----------------------------------------------------------------------
// Combining

var combine = curry3(combine$1);
var combineArray = curry2(combineArray$1);

// -----------------------------------------------------------------------
// Sampling

var sample$1$1 = curry2(sample$1);
var snapshot$1$1 = curry3(snapshot$1);

// -----------------------------------------------------------------------
// Zipping

var zip = curry3(zip$1);
var zipArray = curry2(zipArray$1);

// -----------------------------------------------------------------------
// Filtering

var filter = curry2(filter$1);
var skipRepeatsWith = curry2(skipRepeatsWith$1);

// -----------------------------------------------------------------------
// Slicing

var take = curry2(take$1);
var skip = curry2(skip$1);
var slice = curry3(slice$1);
var takeWhile = curry2(takeWhile$1);
var skipWhile = curry2(skipWhile$1);
var skipAfter = curry2(skipAfter$1);

// -----------------------------------------------------------------------
// Time slicing

var until = curry2(until$1);
var since = curry2(since$1);
var during = curry2(during$1);

// -----------------------------------------------------------------------
// Delaying

var delay$1 = curry2(delay$2);

// -----------------------------------------------------------------------
// Rate limiting

var throttle = curry2(throttle$1);
var debounce = curry2(debounce$1);

// -----------------------------------------------------------------------
// Error handling

var recoverWith = curry2(recoverWith$1);
// ----------------------------------------------------------------------
var propagateTask = curry3(propagateTask$1);
var propagateEventTask = curry2(propagateEventTask$1);
var propagateErrorTask = curry2(propagateErrorTask$1);

//      
                                                                            



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

var sample =        function (b             , s           )            { return snapshot$$1(function (a, b) { return a; }, b, s); };

var snapshot$$1 =           function (f             , b             , s           )            { return b(f, s); };



var always =     function (a   )              { return step(now(a)); };



var step =     function (sa           )              { return function (f             , sb           )            { return snapshot$1$1(f, sa, sb); }; };

var map =        function (f        , b             )              { return function (g             , s           )            { return snapshot$$1(function (a, c) { return g(f(a), c); }, b, s); }; };



var liftA2 =           function (f             , ba             , bb             )              { return function (g             , s           )            {
    var ms = multicast(s);
    return snapshot$1$1(g, zip(f, sample(ba, ms), sample(bb, ms)), ms)
  }; };

/** @license MIT License (c) copyright 2015-2016 original author or authors */
/** @author Brian Cavalier */
// domEvent :: (EventTarget t, Event e) => String -> t -> boolean=false -> Stream e
var domEvent = function (event, node, capture) {
    if ( capture === void 0 ) { capture = false; }

    return new DomEvent(event, node, capture);
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

DomEvent.prototype.run = function run (sink, scheduler$$1) {
    var this$1 = this;

  var send = function (e) { return tryEvent$1(currentTime(scheduler$$1), e, sink); };
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

// inputById :: String -> HTMLInputElement
// Type-safe helper to get an HTMLInputElement by id
var inputById = function (id$$1) {
  var el = document.getElementById(id$$1);
  if(!(el instanceof HTMLInputElement)) { throw new Error(("input #" + id$$1 + " not found")) }
  return el
};

// numberValue :: HTMLInputElement -> Behavior Number
var numberValue = function (input$$1) { return map(function (input$$1) { return Number(input$$1.value); }, always(input$$1)); };

// add :: Number -> Number -> Number
var add = function (x, y) { return x + y; };

// x :: Behavior Number
// x is the value of the #x input at all times
// note that x is not a change event, it's the value over time
var x = numberValue(inputById('x'));

// y :: Behavior Number
// Similarly, y is the value of the #y input at all times
var y = numberValue(inputById('y'));

// z :: Behavior Number
// z is x + y at all times
var z = liftA2(add, x, y);

// inputEvents :: Stream InputEvent
// All the input events that will occur in container
var inputEvents = input(document.getElementById('container'));

// render :: HTMLInputElement -> Number -> void
var render = function (el) { return function (result) { return el.value = String(result); }; };

// updateFrom :: Behavior Number -> Stream void
// Sample z at all the instants input events occur in container
// and render the sampled value into the `#z` input element's value
var updates = tap(render(inputById('z')), sample(z, inputEvents));

// Run the app
runEffects(updates, newDefaultScheduler());

}());
