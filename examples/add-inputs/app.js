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
function map$1 (f, a) {
  var l = a.length;
  var b = new Array(l);
  for (var i = 0; i < l; ++i) {
    b[i] = f(a[i]);
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

PropagateTask.prototype.dispose = function dispose () {
  this.active = false;
};

PropagateTask.prototype.run = function run (t) {
  if (!this.active) {
    return
  }
  var run = this._run;
  run(t, this.value, this.sink, this);
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

var At = function At (t, x) {
  this.time = t;
  this.value = x;
};

At.prototype.run = function run (sink, scheduler) {
  return scheduler.delay(this.time, propagateTask$1(runAt, this.value, sink))
};

function runAt (t, x, sink) {
  sink.event(t, x);
  sink.end(t);
}

var Empty = function Empty () {};

Empty.prototype.run = function run (sink, scheduler) {
  return scheduler.asap(propagateEndTask(sink))
};

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

// Disposable represents a resource that must be
// disposed/released. It aggregates a function to dispose
// the resource and a handle to a key/id/handle/reference
// that identifies the resource
var Disposable = function Disposable (dispose, resource) {
  this._dispose = dispose;
  this._resource = resource;
};

Disposable.prototype.dispose = function dispose () {
  this._dispose(this._resource);
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// Non-mutating array operations

// cons :: a -> [a] -> [a]
// a with x prepended
// reduce :: (a -> b -> a) -> a -> [b] -> a
// accumulate via left-fold
function reduce$1 (f, z, a) {
  var r = z;
  for (var i = 0, l = a.length; i < l; ++i) {
    r = f(r, a[i], i);
  }
  return r
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */
// Aggregate a list of disposables into a DisposeAll
var disposeAll = function (ds) { return new DisposeAll(ds); };

// Convenience to aggregate 2 disposables
var disposeBoth = function (d1, d2) { return disposeAll([d1, d2]); };

var DisposeAll = function DisposeAll (disposables) {
  this.disposables = disposables;
};

DisposeAll.prototype.dispose = function dispose () {
  throwIfErrors(disposeCollectErrors(this.disposables));
};

// Dispose all, safely collecting errors into an array
var disposeCollectErrors = function (disposables) { return reduce$1(appendIfError, [], disposables); };

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

var formatErrorStacks = function (errors) { return reduce$1(formatErrorStack, '', errors); };

var formatErrorStack = function (s, e, i) { return s + "\n[" + ((i + 1)) + "] " + (e.stack); };

/** @license MIT License (c) copyright 2010-2017 original author or authors */

// Try to dispose the disposable.  If it throws, send
// the error to sink.error with the provided Time value
function tryDispose (t, disposable, sink) {
  try {
    disposable.dispose();
  } catch (e) {
    sink.error(t, e);
  }
}

var Never = function Never () {};

Never.prototype.run = function run () {
  return disposeNone()
};

var Periodic = function Periodic (period) {
  this.period = period;
};

Periodic.prototype.run = function run (sink, scheduler) {
  return scheduler.periodic(this.period, propagateEventTask$1(undefined, sink))
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

var ZipArrayValues = function ZipArrayValues (f, values, source) {
  this.f = f;
  this.values = values;
  this.source = source;
};

ZipArrayValues.prototype.run = function run (sink, scheduler) {
  return this.source.run(new ZipArrayValuesSink(this.f, this.values, sink), scheduler)
};

var ZipArrayValuesSink = (function (Pipe$$1) {
  function ZipArrayValuesSink (f, values, sink) {
    Pipe$$1.call(this, sink);
    this.f = f;
    this.values = values;
    this.index = 0;
  }

  if ( Pipe$$1 ) { ZipArrayValuesSink.__proto__ = Pipe$$1; }
  ZipArrayValuesSink.prototype = Object.create( Pipe$$1 && Pipe$$1.prototype );
  ZipArrayValuesSink.prototype.constructor = ZipArrayValuesSink;

  ZipArrayValuesSink.prototype.event = function event (t, b) {
    var f = this.f;
    this.sink.event(t, f(this.values[this.index], b));

    this.index += 1;
    if (this.index >= this.values.length) {
      this.sink.end(t);
    }
  };

  return ZipArrayValuesSink;
}(Pipe));

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

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var runEffects$1 = function (stream, scheduler) { return new Promise(function (resolve, reject) { return runStream(stream, scheduler, resolve, reject); }); };

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

var Scan = function Scan (f, z, source) {
  this.source = source;
  this.f = f;
  this.value = z;
};

Scan.prototype.run = function run (sink, scheduler) {
  var d1 = scheduler.asap(propagateEventTask$1(this.value, sink));
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

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// Non-mutating array operations

// cons :: a -> [a] -> [a]
// a with x prepended
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

// AbstractScheduler should not be exposed publicly
// Temporary mixin to reduce duplication between
// Scheduler and RelativeScheduler.  Eventually,
// the Scheduler interface will change and this
// can be removed.
var AbstractScheduler = function AbstractScheduler () {};

AbstractScheduler.prototype.asap = function asap (task) {
  return this.scheduleTask(0, 0, -1, task)
};

AbstractScheduler.prototype.delay = function delay (delay$1, task) {
  return this.scheduleTask(0, delay$1, -1, task)
};

AbstractScheduler.prototype.periodic = function periodic (period, task) {
  return this.scheduleTask(0, 0, period, task)
};

AbstractScheduler.prototype.schedule = function schedule (delay, period, task) {
  return this.scheduleTask(0, delay, period, task)
};

var RelativeScheduler = (function (AbstractScheduler$$1) {
  function RelativeScheduler (origin, scheduler) {
    AbstractScheduler$$1.call(this);
    this.origin = origin;
    this.scheduler = scheduler;
  }

  if ( AbstractScheduler$$1 ) { RelativeScheduler.__proto__ = AbstractScheduler$$1; }
  RelativeScheduler.prototype = Object.create( AbstractScheduler$$1 && AbstractScheduler$$1.prototype );
  RelativeScheduler.prototype.constructor = RelativeScheduler;

  RelativeScheduler.prototype.now = function now () {
    return this.scheduler.now() - this.origin
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

  return RelativeScheduler;
}(AbstractScheduler));

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
    var at = findIndex$1(st, this.tasks[i].events);
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
  timeslot.events = removeAll$1(f, timeslot.events);
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

/*global setTimeout, clearTimeout*/

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

/*global performance, process*/

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

var schedulerRelativeTo = curry2$1(function (offset, scheduler) { return new RelativeScheduler(offset, scheduler); });

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var runWithLocalTime = function (origin, stream, sink, scheduler) { return stream.run(new RelativeSink(origin, sink), schedulerRelativeTo(origin, scheduler)); };

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
    return runWithLocalTime(t, f(), sink, this.scheduler)
  };

  ContinueWithSink.prototype.dispose = function dispose () {
    this.active = false;
    return this.disposable.dispose()
  };

  return ContinueWithSink;
}(Pipe));

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

var Map$1 = function Map (f, source) {
  this.f = f;
  this.source = source;
};

Map$1.prototype.run = function run (sink, scheduler) { // eslint-disable-line no-extend-native
  return this.source.run(new MapSink(this.f, sink), scheduler)
};

/**
 * Create a mapped source, fusing adjacent map.map, filter.map,
 * and filter.map.map if possible
 * @param {function(*):*} f mapping function
 * @param {{run:function}} source source to map
 * @returns {Map|FilterMap} mapped source, possibly fused
 */
Map$1.create = function create (f, source) {
  if (source instanceof Map$1) {
    return new Map$1(compose(f, source.f), source.source)
  }

  if (source instanceof Filter) {
    return new FilterMap(source.p, f, source.source)
  }

  return new Map$1(f, source)
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

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @param {Stream} stream stream to map
 * @returns {Stream} stream containing items transformed by f
 */
var map$2 = function (f, stream) { return Map$1.create(f, stream); };

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

Outer.prototype.dispose = function dispose () {
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

Inner.prototype.dispose = function dispose () {
  return this.disposable.dispose()
};

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

/** @license MIT License (c) copyright 2010-2016 original author or authors */

var sample$1 = function (f, sampler, stream) { return new Sample(f, sampler, stream); };

var Sample = function Sample (f, sampler, stream) {
  this.source = stream;
  this.sampler = sampler;
  this.f = f;
};

Sample.prototype.run = function run (sink, scheduler) {
  var sampleSink = new SampleSink(this.f, this.source, sink);
  var sourceDisposable = this.source.run(sampleSink.hold, scheduler);
  var samplerDisposable = this.sampler.run(sampleSink, scheduler);

  return disposeBoth(samplerDisposable, sourceDisposable)
};

var SampleSink = (function (Pipe$$1) {
  function SampleSink (f, source, sink) {
    Pipe$$1.call(this, sink);
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

  SampleHold.prototype.end = function end () {};

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
    copy$1(this, 0, this, oldCapacity, last & (oldCapacity - 1));
  }
};

function copy$1 (src, srcIndex, dst, dstIndex, len) {
  for (var j = 0; j < len; ++j) {
    dst[j + dstIndex] = src[j + srcIndex];
    src[j + srcIndex] = void 0;
  }
}

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

var emitZipped = function (f, t, buffers, sink) { return sink.event(t, invoke(f, map$1(head, buffers))); };

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
  this._disposeCurrent(t); // TODO: capture the result of this dispose
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

var Slice = function Slice (min, max, source) {
  this.source = source;
  this.min = min;
  this.max = max;
};

Slice.prototype.run = function run (sink, scheduler) {
  return this.source.run(new SliceSink(this.min, this.max - this.min, sink), scheduler)
};

var SliceSink = (function (Pipe$$1) {
  function SliceSink (skip, take, sink) {
    Pipe$$1.call(this, sink);
    this.skip = skip;
    this.take = take;
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
      this.sink.end(t);
    }
  };

  return SliceSink;
}(Pipe));

var TakeWhile = function TakeWhile (p, source) {
  this.p = p;
  this.source = source;
};

TakeWhile.prototype.run = function run (sink, scheduler) {
  return this.source.run(new TakeWhileSink(this.p, sink), scheduler)
};

var TakeWhileSink = (function (Pipe$$1) {
  function TakeWhileSink (p, sink) {
    Pipe$$1.call(this, sink);
    this.p = p;
    this.active = true;
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
      this.sink.end(t);
    }
  };

  return TakeWhileSink;
}(Pipe));

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

  Bound.prototype.dispose = function dispose () {};

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

  LowerBound.prototype.dispose = function dispose () {
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

  UpperBound.prototype.dispose = function dispose () {
    return this.disposable.dispose()
  };

  return UpperBound;
}(Pipe));

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

  DelaySink.prototype.dispose = function dispose () {
    var this$1 = this;

    this.scheduler.cancelAll(function (task) { return task.sink === this$1.sink; });
  };

  DelaySink.prototype.event = function event (t, x) {
    this.scheduler.delay(this.dt, propagateEventTask$1(x, this.sink));
  };

  DelaySink.prototype.end = function end (t) {
    this.scheduler.delay(this.dt, propagateEndTask(this.sink));
  };

  return DelaySink;
}(Pipe));

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

  var sourceDisposable = source.run(this, scheduler);
  this.disposable = disposeBoth(this, sourceDisposable);
};

DebounceSink.prototype.event = function event (t, x) {
  this._clearTimer();
  this.value = x;
  this.timer = this.scheduler.delay(this.dt, propagateEventTask$1(x, this.sink));
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

DebounceSink.prototype.dispose = function dispose () {
  this._clearTimer();
};

DebounceSink.prototype._clearTimer = function _clearTimer () {
  if (this.timer === null) {
    return false
  }
  this.timer.dispose();
  this.timer = null;
  return true
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
  this._endBound = function () { return this$1.sink.end(this$1.scheduler.now()); };
  this._errorBound = function (e) { return this$1.sink.error(this$1.scheduler.now(), e); };
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

var ErrorStream = function ErrorStream (e) {
  this.value = e;
};

ErrorStream.prototype.run = function run (sink, scheduler) {
  return scheduler.asap(propagateErrorTask$1(this.value, sink))
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
  return runWithLocalTime(t, f(x), sink, this.scheduler)
};

RecoverWithSink.prototype.dispose = function dispose () {
  return this.disposable.dispose()
};

var Multicast = function Multicast (source) {
  this.source = new MulticastSource(source);
};
Multicast.prototype.run = function run (sink, scheduler) {
  return this.source.run(sink, scheduler)
};

var MulticastSource = function MulticastSource (source) {
  this.source = source;
  this.sinks = [];
  this._disposable = disposeNone();
};

MulticastSource.prototype.run = function run (sink, scheduler) {
  var n = this.add(sink);
  if (n === 1) {
    this._disposable = this.source.run(this, scheduler);
  }
  return disposeOnce(new MulticastDisposable(this, sink))
};

MulticastSource.prototype._dispose = function _dispose () {
  var disposable = this._disposable;
  this._disposable = disposeNone();
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

MulticastDisposable.prototype.dispose = function dispose () {
  if (this.source.remove(this.sink) === 0) {
    this.source._dispose();
  }
};

// -----------------------------------------------------------------------
// Observing

var runEffects = curry2(runEffects$1);

// -----------------------------------------------------------------------
// Transforming

var map$1$1 = curry2(map$2);
var constant = curry2(constant$1);
var tap = curry2(tap$1);
// -----------------------------------------------------------------------
// Sampling

var sample$1$1 = curry3(sample$1);

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
function append$1 (x, a) {
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
function map$2$1 (f, a) {
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
function remove$1 (i, a) {  // eslint-disable-line complexity
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

  return unsafeRemove$1(i, a, l - 1)
}

// unsafeRemove :: Int -> [a] -> Int -> [a]
// Internal helper to remove element at index
function unsafeRemove$1 (i, a, l) {
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
function findIndex$1$1 (x, a) {
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
function curry2$1$1 (f) {
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
      case 1: return curry2$1$1(function (b, c) { return f(a, b, c); })
      case 2: return function (c) { return f(a, b, c); }
      default:return f(a, b, c)
    }
  }
  return curried
}

// ------------------------------------------------------
// Event helpers

var mapWithTime = function (f, stream) { return new MapWithTimeStream(f, stream); };

var MapWithTimeStream = function MapWithTimeStream (f, source) {
  this.f = f;
  this.source = source;
};

MapWithTimeStream.prototype.run = function run (sink, scheduler) {
  return this.source.run(new MapWithTimeSink(this.f, sink), scheduler)
};

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

MapWithTimeSink.prototype.end = function end (t) {
  this.sink.end(t);
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */

var Queue$1 = function Queue (capPow2) {
  this._capacity = capPow2 || 32;
  this._length = 0;
  this._head = 0;
};

Queue$1.prototype.push = function push (x) {
  var len = this._length;
  this._checkCapacity(len + 1);

  var i = (this._head + len) & (this._capacity - 1);
  this[i] = x;
  this._length = len + 1;
};

Queue$1.prototype.shift = function shift () {
  var head = this._head;
  var x = this[head];

  this[head] = void 0;
  this._head = (head + 1) & (this._capacity - 1);
  this._length--;
  return x
};

Queue$1.prototype.isEmpty = function isEmpty () {
  return this._length === 0
};

Queue$1.prototype.length = function length () {
  return this._length
};

Queue$1.prototype._checkCapacity = function _checkCapacity (size) {
  if (this._capacity < size) {
    this._ensureCapacity(this._capacity << 1);
  }
};

Queue$1.prototype._ensureCapacity = function _ensureCapacity (capacity) {
  var oldCapacity = this._capacity;
  this._capacity = capacity;

  var last = this._head + this._length;

  if (last > oldCapacity) {
    copy$1$1(this, 0, this, oldCapacity, last & (oldCapacity - 1));
  }
};

function copy$1$1 (src, srcIndex, dst, dstIndex, len) {
  for (var j = 0; j < len; ++j) {
    dst[j + dstIndex] = src[j + srcIndex];
    src[j + srcIndex] = void 0;
  }
}

var zip2 = function (f, s1, s2) { return new Zip2Stream(f, s1, s2); };

var Zip2Stream = function Zip2Stream (f, s1, s2) {
  this.f = f;
  this.s1 = s1;
  this.s2 = s2;
};

Zip2Stream.prototype.run = function run (sink, scheduler) {
  var state = { active: 2 };
  var q1 = new Queue$1();
  var q2 = new Queue$1();
  var d1 = this.s1.run(new Zip2LSink(this.f, q1, q2, state, sink), scheduler);
  var d2 = this.s2.run(new Zip2RSink(this.f, q2, q1, state, sink), scheduler);
  return new DisposeBoth(d1, d2)
};

var Zip2LSink = function Zip2LSink (f, values, other, state, sink) {
  this.f = f;
  this.values = values;
  this.other = other;
  this.state = state;
  this.sink = sink;
};

Zip2LSink.prototype.event = function event (t, x) {
  if (this.other.isEmpty()) {
    this.values.push(x);
  } else {
    this._event(t, x);
  }
};

Zip2LSink.prototype.end = function end (t) {
  if (--this.state.active === 0) {
    this.sink.end(t);
  }
};

Zip2LSink.prototype.error = function error (t, e) {
  this.sink.error(t, e);
};

Zip2LSink.prototype._event = function _event (t, a) {
  var f = this.f;
  this.sink.event(t, f(a, this.other.shift()));
};

var Zip2RSink = (function (Zip2LSink) {
  function Zip2RSink () {
    Zip2LSink.apply(this, arguments);
  }

  if ( Zip2LSink ) Zip2RSink.__proto__ = Zip2LSink;
  Zip2RSink.prototype = Object.create( Zip2LSink && Zip2LSink.prototype );
  Zip2RSink.prototype.constructor = Zip2RSink;

  Zip2RSink.prototype._event = function _event (t, b) {
    var f = this.f;
    this.sink.event(t, f(this.other.shift(), b));
  };

  return Zip2RSink;
}(Zip2LSink));

var DisposeBoth = function DisposeBoth (d1, d2) {
  this.d1 = d1;
  this.d2 = d2;
};

DisposeBoth.prototype.dispose = function dispose () {
  this.d1.dispose();
  this.d2.dispose();
};

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var disposeNone$1 = function () { return NONE$1; };
var NONE$1 = new ((function () {
  function DisposeNone () {}

  DisposeNone.prototype.dispose = function dispose () {};

  return DisposeNone;
}()))();

var DisposeOnce$1 = function DisposeOnce (disposable) {
  this.disposed = false;
  this.disposable = disposable;
};

DisposeOnce$1.prototype.dispose = function dispose () {
  if (!this.disposed) {
    this.disposed = true;
    this.disposable.dispose();
    this.disposable = undefined;
  }
};

// Disposable represents a resource that must be
// disposed/released. It aggregates a function to dispose
// the resource and a handle to a key/id/handle/reference
// that identifies the resource
var Disposable$1 = function Disposable (dispose, resource) {
  this._dispose = dispose;
  this._resource = resource;
};

Disposable$1.prototype.dispose = function dispose () {
  this._dispose(this._resource);
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// Non-mutating array operations

// cons :: a -> [a] -> [a]
// a with x prepended
// reduce :: (a -> b -> a) -> a -> [b] -> a
// accumulate via left-fold
function reduce$2 (f, z, a) {
  var r = z;
  for (var i = 0, l = a.length; i < l; ++i) {
    r = f(r, a[i], i);
  }
  return r
}

var DisposeAll$1 = function DisposeAll (disposables) {
  this.disposables = disposables;
};

DisposeAll$1.prototype.dispose = function dispose () {
  throwIfErrors$1(disposeCollectErrors$1(this.disposables));
};

// Dispose all, safely collecting errors into an array
var disposeCollectErrors$1 = function (disposables) { return reduce$2(appendIfError$1, [], disposables); };

// Call dispose and if throws, append thrown error to errors
var appendIfError$1 = function (errors, d) {
  try {
    d.dispose();
  } catch (e) {
    errors.push(e);
  }
  return errors
};

// Throw DisposeAllError if errors is non-empty
var throwIfErrors$1 = function (errors) {
  if (errors.length > 0) {
    throw new DisposeAllError$1(((errors.length) + " errors"), errors)
  }
};

// Aggregate Error type for DisposeAll
var DisposeAllError$1 = (function (Error) {
  function DisposeAllError (message, errors) {
    Error.call(this, message);
    this.message = message;
    this.name = this.constructor.name;
    this.errors = errors;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.stack = "" + (this.stack) + (formatErrorStacks$1(this.errors));
  }

  if ( Error ) { DisposeAllError.__proto__ = Error; }
  DisposeAllError.prototype = Object.create( Error && Error.prototype );
  DisposeAllError.prototype.constructor = DisposeAllError;

  DisposeAllError.prototype.toString = function toString () {
    return this.stack
  };

  return DisposeAllError;
}(Error));

var formatErrorStacks$1 = function (errors) { return reduce$2(formatErrorStack$1, '', errors); };

var formatErrorStack$1 = function (s, e, i) { return s + "\n[" + ((i + 1)) + "] " + (e.stack); };

var split = function (stream) {
  var sp = new SplitStream(stream);
  return [sp, sp]
};

var nullSink = {
  event: function event (t, x) {},
  end: function end (t) {},
  error: function error (t, x) {}
};

var SplitDisposable = function SplitDisposable (source, sink) {
  this.source = source;
  this.sink = sink;
};

SplitDisposable.prototype.dispose = function dispose () {
  if (this.sink === this.source.sink0) {
    this.source.sink0 = this.source.sink1;
    this.source.sink1 = nullSink;
  } else {
    this.source.sink1 = nullSink;
  }

  if (this.source.sink0 === nullSink) {
    return this.source.disposable.dispose()
  }
};

var SplitStream = function SplitStream (source) {
  this.source = source;
  this.sink0 = nullSink;
  this.sink1 = nullSink;
  this.disposable = disposeNone$1();
};

SplitStream.prototype.run = function run (sink, scheduler) {
  if (this.sink0 === nullSink) {
    this.sink0 = sink;
    this.disposable = this.source.run(this, scheduler);
  } else if (this.sink1 === nullSink) {
    this.sink1 = sink;
  } else {
    throw new TypeError('> 2 observers')
  }

  return new SplitDisposable(this, sink)
};

SplitStream.prototype._dispose = function _dispose () {
  var disposable = this._disposable;
  this._disposable = nullDisposable;
  return disposable.dispose()
};

SplitStream.prototype.event = function event (time, value) {
  this.sink0.event(time, value);
  this.sink1.event(time, value);
};

SplitStream.prototype.end = function end (time) {
  this.sink0.end(time);
  this.sink1.end(time);
};

SplitStream.prototype.error = function error (time, err) {
  this.sink0.error(time, err);
  this.sink1.error(time, err);
};

// sample :: Event a -> Behavior b -> Event b
// Sample a behavior at all the event times
// Returns a new event stream whose events occur at the same
// times as the input event stream, and whose values are
// sampled from the behavior
var sample$$1 = curry2$1$1(function (event, behavior) { return behavior.sample(event); });

// snapshot :: (a -> b -> c) -> Event a -> Behavior b -> Event c
// Apply a function to each event value and the behavior's
// value, sampled at the time of the event.  Returns a new
// event stream whose events occur at the same times as the
// input event stream, and whose values are the result of
// applying the function


// Base Behavior typeclass
// Implementations:
// - MUST define at least one of sample or snapshot
// - MAY define both as an optimization
var Behavior = function Behavior () {};

Behavior.prototype.sample = function sample$$1 (event) {
  return this.snapshot(snd, event)
};

Behavior.prototype.snapshot = function snapshot (f, event) {
  var ref = split(event);
    var e1 = ref[0];
    var e2 = ref[1];
  return sample$1$1(f, this.sample(e1), e2)
};

// always :: a -> Behavior a
// A behavior whose value never varies
var always = function (x) { return new Constant(x); };

var Constant = (function (Behavior) {
  function Constant (value) {
    Behavior.call(this);
    this.value = value;
  }

  if ( Behavior ) Constant.__proto__ = Behavior;
  Constant.prototype = Object.create( Behavior && Behavior.prototype );
  Constant.prototype.constructor = Constant;

  Constant.prototype.sample = function sample$$1 (event) {
    return constant(this.value, event)
  };

  Constant.prototype.snapshot = function snapshot (f, event) {
    var this$1 = this;

    return map$1$1(function (a) { return f(a, this$1.value); }, event)
  };

  return Constant;
}(Behavior));

var Time = (function (Behavior) {
  function Time () {
    Behavior.apply(this, arguments);
  }

  if ( Behavior ) Time.__proto__ = Behavior;
  Time.prototype = Object.create( Behavior && Behavior.prototype );
  Time.prototype.constructor = Time;

  Time.prototype.sample = function sample$$1 (event) {
    return mapWithTime(function (t, _) { return t; }, event)
  };

  Time.prototype.snapshot = function snapshot (g, event) {
    return mapWithTime(function (t, a) { return g(a, t); }, event)
  };

  return Time;
}(Behavior));

// time :: Behavior Time
// A behavior whose value is the current time, as reported
// by whatever scheduler is in use (not wall clock time)
var time = new Time();

// fromStream :: a -> Event a -> Behavior a
// A behavior that starts with an initial value, and then
// changes discretely to the value of each update event.


var snd = function (a, b) { return b; };

// map :: (a -> b) -> Behavior a -> Behavior b
// Transform the behavior's value at all points in time
var map$$1 = curry2$1$1(function (f, behavior) { return new Map(f, behavior); });

var Map = (function (Behavior) {
  function Map (f, behavior) {
    Behavior.call(this);
    this.f = f;
    this.behavior = behavior;
  }

  if ( Behavior ) Map.__proto__ = Behavior;
  Map.prototype = Object.create( Behavior && Behavior.prototype );
  Map.prototype.constructor = Map;

  Map.prototype.sample = function sample$$1 (event) {
    return map$1$1(this.f, this.behavior.sample(event))
  };

  Map.prototype.snapshot = function snapshot (g, event) {
    var f = this.f;
    return this.behavior.snapshot(function (a, b) { return g(a, f(b)); }, event)
  };

  return Map;
}(Behavior));

// liftA2 :: (a -> b -> c) -> Behavior a -> Behavior a -> Behavior c
// Apply a function to 2 Behaviors.  Effectively lifts a 2-arg function
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

  LiftA2.prototype.sample = function sample$$1 (event) {
    var ref = split(event);
    var e1 = ref[0];
    var e2 = ref[1];
    return zip2(this.f, this.b1.sample(e1), this.b2.sample(e2))
  };

  return LiftA2;
}(Behavior));

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Stream$1 (source) {
  this.source = source;
}

Stream$1.prototype.run = function (sink, scheduler) {
  return this.source.run(sink, scheduler)
};

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Create a new Disposable which will dispose its underlying resource.
 * @param {function} dispose function
 * @param {*?} data any data to be passed to disposer function
 * @constructor
 */
function Disposable$2 (dispose, data) {
  this._dispose = dispose;
  this._data = data;
}

Disposable$2.prototype.dispose = function () {
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

function isPromise (p) {
  return p !== null && typeof p === 'object' && typeof p.then === 'function'
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */
var map$3 = map$2$1;
var identity = id$1;

/**
 * Call disposable.dispose.  If it returns a promise, catch promise
 * error and forward it through the provided sink.
 * @param {number} t time
 * @param {{dispose: function}} disposable
 * @param {{error: function}} sink
 * @return {*} result of disposable.dispose
 */
function tryDispose$2 (t, disposable, sink) {
  var result = disposeSafely(disposable);
  return isPromise(result)
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
function create (dispose, data) {
  return once(new Disposable$2(dispose, data))
}

/**
 * Create a noop disposable. Can be used to satisfy a Disposable
 * requirement when no actual resource needs to be disposed.
 * @return {Disposable|exports|module.exports}
 */
function empty$2 () {
  return new Disposable$2(identity, void 0)
}

/**
 * Create a disposable that will dispose all input disposables in parallel.
 * @param {Array<Disposable>} disposables
 * @return {Disposable}
 */
function all (disposables) {
  return create(disposeAll$2, disposables)
}

function disposeAll$2 (disposables) {
  return Promise.all(map$3(disposeSafely, disposables))
}

function disposeSafely (disposable) {
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
function settable () {
  return new SettableDisposable$1()
}

/**
 * Wrap an existing disposable (which may not already have been once()d)
 * so that it will only dispose its underlying resource at most once.
 * @param {{ dispose: function() }} disposable
 * @return {Disposable} wrapped disposable
 */
function once (disposable) {
  return new Disposable$2(disposeMemoized, memoized(disposable))
}

function disposeMemoized (memoized) {
  if (!memoized.disposed) {
    memoized.disposed = true;
    memoized.value = disposeSafely(memoized.disposable);
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
  return new PropagateTask$1(emit, value, sink)
};

PropagateTask$1.end = function (value, sink) {
  return new PropagateTask$1(end, value, sink)
};

PropagateTask$1.error = function (value, sink) {
  return new PropagateTask$1(error$1, value, sink)
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

function error$1 (t, e, sink) {
  sink.error(t, e);
}

function emit (t, x, sink) {
  sink.event(t, x);
}

function end (t, x, sink) {
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
  return new Stream$1(new Just(x))
}

function Just (x) {
  this.value = x;
}

Just.prototype.run = function (sink, scheduler) {
  return scheduler.asap(new PropagateTask$1(runJust, this.value, sink))
};

function runJust (t, x, sink) {
  sink.event(t, x);
  sink.end(t, void 0);
}

/**
 * Stream containing no events and ends immediately
 * @returns {Stream}
 */
function empty$1 () {
  return EMPTY$1
}

function EmptySource () {}

EmptySource.prototype.run = function (sink, scheduler) {
  var task = PropagateTask$1.end(void 0, sink);
  scheduler.asap(task);

  return create(disposeEmpty, task)
};

function disposeEmpty (task) {
  return task.dispose()
}

var EMPTY$1 = new Stream$1(new EmptySource());

/**
 * Stream containing no events and never ends
 * @returns {Stream}
 */

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function fromArray (a) {
  return new Stream$1(new ArraySource(a))
}

function ArraySource (a) {
  this.array = a;
}

ArraySource.prototype.run = function (sink, scheduler) {
  return scheduler.asap(new PropagateTask$1(runProducer, this.array, sink))
};

function runProducer (t, array, sink) {
  for (var i = 0, l = array.length; i < l && this.active; ++i) {
    sink.event(t, array[i]);
  }

  this.active && sink.end(t);
}

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

function isIterable (o) {
  return typeof o[iteratorSymbol] === 'function'
}

function getIterator (o) {
  return o[iteratorSymbol]()
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function fromIterable (iterable) {
  return new Stream$1(new IterableSource(iterable))
}

function IterableSource (iterable) {
  this.iterable = iterable;
}

IterableSource.prototype.run = function (sink, scheduler) {
  return scheduler.asap(new PropagateTask$1(runProducer$1, getIterator(this.iterable), sink))
};

function runProducer$1 (t, iterator, sink) {
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

function tryEvent$2 (t, x, sink) {
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
    return create(sub)
  } else if (sub && typeof sub.unsubscribe === 'function') {
    return create(unsubscribe, sub)
  }

  throw new TypeError('Observable returned invalid subscription ' + String(sub))
};

function SubscriberSink (sink, scheduler) {
  this.sink = sink;
  this.scheduler = scheduler;
}

SubscriberSink.prototype.next = function (x) {
  tryEvent$2(this.scheduler.now(), x, this.sink);
};

SubscriberSink.prototype.complete = function (x) {
  tryEnd$1(this.scheduler.now(), x, this.sink);
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
    return fromArray(a)
  }

  if (isIterable(a)) {
    return fromIterable(a)
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

function Scheduler (timer, timeline) {
  this.timer = timer;
  this.timeline = timeline;

  this._timer = null;
  this._nextArrival = Infinity;

  var self = this;
  this._runReadyTasksBound = function () {
    self._runReadyTasks(self.now());
  };
}

Scheduler.prototype.now = function () {
  return this.timer.now()
};

Scheduler.prototype.asap = function (task) {
  return this.schedule(0, -1, task)
};

Scheduler.prototype.delay = function (delay, task) {
  return this.schedule(delay, -1, task)
};

Scheduler.prototype.periodic = function (period, task) {
  return this.schedule(0, period, task)
};

Scheduler.prototype.schedule = function (delay, period, task) {
  var now = this.now();
  var st = new ScheduledTask$1(now + Math.max(0, delay), period, task, this);

  this.timeline.add(st);
  this._scheduleNextRun(now);
  return st
};

Scheduler.prototype.cancel = function (task) {
  task.active = false;
  if (this.timeline.remove(task)) {
    this._reschedule();
  }
};

Scheduler.prototype.cancelAll = function (f) {
  this.timeline.removeAll(f);
  this._reschedule();
};

Scheduler.prototype._reschedule = function () {
  if (this.timeline.isEmpty()) {
    this._unschedule();
  } else {
    this._scheduleNextRun(this.now());
  }
};

Scheduler.prototype._unschedule = function () {
  this.timer.clearTimer(this._timer);
  this._timer = null;
};

Scheduler.prototype._scheduleNextRun = function (now) { // eslint-disable-line complexity
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

Scheduler.prototype._scheduleNextArrival = function (nextArrival, now) {
  this._nextArrival = nextArrival;
  var delay = Math.max(0, nextArrival - now);
  this._timer = this.timer.setTimer(this._runReadyTasksBound, delay);
};

Scheduler.prototype._runReadyTasks = function (now) {
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
    var at = findIndex$1$1(st, this.tasks[i].events);
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
    this$1.tasks = runTasks(runTask, tasks[j], this$1.tasks);
  }
};

function runTasks (runTask, timeslot, tasks) { // eslint-disable-line complexity
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

function newTimeslot$1 (t, events) {
  return { time: t, events: events }
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var defaultScheduler = new Scheduler(new ClockTimer$1(), new Timeline$1());

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function subscribe (subscriber, stream) {
  if (Object(subscriber) !== subscriber) {
    throw new TypeError('subscriber must be an object')
  }

  var disposable = settable();
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

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

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
    runSource(source, scheduler, resolve, reject);
  })
}

function runSource (source, scheduler, resolve, reject) {
  var disposable = settable();
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
  disposeThen(this._end, this._error, this._disposable, x);
};

Drain.prototype.error = function (t, e) {
  this.active = false;
  disposeThen(this._error, this._error, this._disposable, e);
};

function disposeThen (end, error, disposable, x) {
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
function map$4 (f, stream) {
  return new Stream$1(Map$2.create(f, stream.source))
}

/**
* Replace each value in the stream with x
* @param {*} x
* @param {Stream} stream
* @returns {Stream} stream containing items replaced with x
*/
function constant$1$1 (x, stream) {
  return map$4(function () {
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
function tap$1$1 (f, stream) {
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
  return drain(tap$1$1(f, stream))
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
function loop$1$1 (stepper, seed, stream) {
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
function scan$1$1 (f, initial, stream) {
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
  return all([d1, d2])
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
function reduce$3 (f, initial, stream) {
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

/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Compute a stream using an *async* generator, which yields promises
 * to control event times.
 * @param f
 * @returns {Stream}
 */

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function continueWith$1$1 (f, stream) {
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
  this.disposable = once(source.run(this, scheduler));
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

  tryDispose$2(t, this.disposable, this.sink);
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
  return continueWith$1$1(function () {
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

var map$5 = map$2$1;
var tail$1 = tail;

/**
 * Combine latest events from all input streams
 * @param {function(...events):*} f function to combine most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */
function combine$1$1 (f /*, ...streams */) {
  return combineArray$1$1(f, tail$1(arguments))
}

/**
* Combine latest events from all input streams
* @param {function(...events):*} f function to combine most recent events
* @param {[Stream]} streams most recent events
* @returns {Stream} stream containing the result of applying f to the most recent
*  event of each input stream, whenever a new event arrives on any stream.
*/
function combineArray$1$1 (f, streams) {
  var l = streams.length;
  return l === 0 ? empty$1()
  : l === 1 ? map$4(f, streams[0])
  : new Stream$1(combineSources(f, streams))
}

function combineSources (f, streams) {
  return new Combine$1(f, map$5(getSource, streams))
}

function getSource (stream) {
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

  return all(disposables)
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
  tryDispose$2(t, this.disposables[indexedValue.index], this.sink);
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
function ap$1$1 (fs, xs) {
  return combine$1$1(apply$1, fs, xs)
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

function mergeConcurrently$1$1 (concurrency, stream) {
  return mergeMapConcurrently$1$1(id$1, concurrency, stream)
}

function mergeMapConcurrently$1$1 (f, concurrency, stream) {
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
  this.disposable = once(source.run(this, scheduler));
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
  tryDispose$2(t, this.disposable, this.sink);
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
  tryDispose$2(t, inner, this);

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
  return mergeMapConcurrently$1$1(f, Infinity, stream)
}

/**
 * Monadic join. Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer. Event arrival times are preserved.
 * @param {Stream<Stream<X>>} stream stream of streams
 * @returns {Stream<X>} new stream containing all events of all inner streams
 */
function join$1 (stream) {
  return mergeConcurrently$1$1(Infinity, stream)
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
function concatMap$1$1 (f, stream) {
  return mergeMapConcurrently$1$1(f, 1, stream)
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var reduce$4 = reduce$1$1;

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
  return l === 0 ? empty$1()
    : l === 1 ? streams[0]
    : new Stream$1(mergeSources(streams))
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
function mergeSources (streams) {
  return new Merge$1(reduce$4(appendSources$1, [], streams))
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

  return all(disposables)
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
  tryDispose$2(t, this.disposables[indexedValue.index], this.sink);
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
  return new Stream$1(new Sampler(f, sampler.source, map$2$1(getSource$1, streams)))
}

function getSource$1 (stream) {
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

  return all(disposables)
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
    this.sink.event(t, invoke$1(this.f, map$2$1(getValue, this.sinks)));
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

function Queue$2 (capPow2) {
  this._capacity = capPow2 || 32;
  this._length = 0;
  this._head = 0;
}

Queue$2.prototype.push = function (x) {
  var len = this._length;
  this._checkCapacity(len + 1);

  var i = (this._head + len) & (this._capacity - 1);
  this[i] = x;
  this._length = len + 1;
};

Queue$2.prototype.shift = function () {
  var head = this._head;
  var x = this[head];

  this[head] = void 0;
  this._head = (head + 1) & (this._capacity - 1);
  this._length--;
  return x
};

Queue$2.prototype.isEmpty = function () {
  return this._length === 0
};

Queue$2.prototype.length = function () {
  return this._length
};

Queue$2.prototype._checkCapacity = function (size) {
  if (this._capacity < size) {
    this._ensureCapacity(this._capacity << 1);
  }
};

Queue$2.prototype._ensureCapacity = function (capacity) {
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

var map$6 = map$2$1;
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
function zipArray$1$1 (f, streams) {
  return streams.length === 0 ? empty$1()
: streams.length === 1 ? map$4(f, streams[0])
: new Stream$1(new Zip$1(f, map$6(getSource$2, streams)))
}

function getSource$2 (stream) {
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
    buffers[i] = new Queue$2();
    indexSink = sinks[i] = new IndexSink$1(i, zipSink);
    disposables[i] = this$1.sources[i].run(indexSink, scheduler);
  }

  return all(disposables)
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
  sink.event(t, invoke$1(f, map$6(head$1, buffers)));
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
  return all([switchSink, this.source.run(switchSink, scheduler)])
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
  this.disposable = empty$2();
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
  tryDispose$2(t, this.disposable, this.sink);
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
function filter$1$1 (p, stream) {
  return new Stream$1(Filter$1.create(p, stream.source))
}

/**
 * Skip repeated events, using === to detect duplicates
 * @param {Stream} stream stream from which to omit repeated events
 * @returns {Stream} stream without repeated events
 */
function skipRepeats$1 (stream) {
  return skipRepeatsWith$1$1(same$1, stream)
}

/**
 * Skip repeated events using the provided equals function to detect duplicates
 * @param {function(a:*, b:*):boolean} equals optional function to compare items
 * @param {Stream} stream stream from which to omit repeated events
 * @returns {Stream} stream without repeated events
 */
function skipRepeatsWith$1$1 (equals, stream) {
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
function take$1$1 (n, stream) {
  return slice$1$1(0, n, stream)
}

/**
 * @param {number} n
 * @param {Stream} stream
 * @returns {Stream} new stream with the first n items removed
 */
function skip$1$1 (n, stream) {
  return slice$1$1(n, Infinity, stream)
}

/**
 * Slice a stream by index. Negative start/end indexes are not supported
 * @param {number} start
 * @param {number} end
 * @param {Stream} stream
 * @returns {Stream} stream containing items where start <= index < end
 */
function slice$1$1 (start, end, stream) {
  return end <= start ? empty$1()
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
  return this.source.run(new SliceSink$1(this.min, this.max - this.min, sink), scheduler)
};

function SliceSink$1 (skip, take, sink) {
  this.sink = sink;
  this.skip = skip;
  this.take = take;
}

SliceSink$1.prototype.end = Pipe$1.prototype.end;
SliceSink$1.prototype.error = Pipe$1.prototype.error;

SliceSink$1.prototype.event = function (t, x) {
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
    this.sink.end(t, x);
  }
};

function takeWhile$1$1 (p, stream) {
  return new Stream$1(new TakeWhile$1(p, stream.source))
}

function TakeWhile$1 (p, source) {
  this.p = p;
  this.source = source;
}

TakeWhile$1.prototype.run = function (sink, scheduler) {
  return this.source.run(new TakeWhileSink$1(this.p, sink), scheduler)
};

function TakeWhileSink$1 (p, sink) {
  this.p = p;
  this.sink = sink;
  this.active = true;
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
    this.sink.end(t, x);
  }
};

function skipWhile$1$1 (p, stream) {
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

function skipAfter (p, stream) {
  return new Stream$1(new SkipAfter$1(p, stream.source))
}

function SkipAfter$1 (p, source) {
  this.p = p;
  this.source = source;
}

SkipAfter$1.prototype.run = function run (sink, scheduler) {
  return this.source.run(new SkipAfterSink$1(this.p, sink), scheduler)
};

function SkipAfterSink$1 (p, sink) {
  this.p = p;
  this.sink = sink;
  this.skipping = false;
}

SkipAfterSink$1.prototype.event = function event (t, x) {
  if (this.skipping) {
    return
  }

  var p = this.p;
  this.skipping = p(x);
  this.sink.event(t, x);

  if (this.skipping) {
    this.sink.end(t, x);
  }
};

SkipAfterSink$1.prototype.end = Pipe$1.prototype.end;
SkipAfterSink$1.prototype.error = Pipe$1.prototype.error;

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function takeUntil (signal, stream) {
  return new Stream$1(new Until$1(signal.source, stream.source))
}

function skipUntil (signal, stream) {
  return new Stream$1(new Since$1(signal.source, stream.source))
}

function during$1$1 (timeWindow, stream) {
  return takeUntil(join$1(timeWindow), skipUntil(timeWindow, stream))
}

function Until$1 (maxSignal, source) {
  this.maxSignal = maxSignal;
  this.source = source;
}

Until$1.prototype.run = function (sink, scheduler) {
  var min = new Bound$1(-Infinity, sink);
  var max = new UpperBound$1(this.maxSignal, sink, scheduler);
  var disposable = this.source.run(new TimeWindowSink$1(min, max, sink), scheduler);

  return all([min, max, disposable])
};

function Since$1 (minSignal, source) {
  this.minSignal = minSignal;
  this.source = source;
}

Since$1.prototype.run = function (sink, scheduler) {
  var min = new LowerBound$1(this.minSignal, sink, scheduler);
  var max = new Bound$1(Infinity, sink);
  var disposable = this.source.run(new TimeWindowSink$1(min, max, sink), scheduler);

  return all([min, max, disposable])
};

function Bound$1 (value, sink) {
  this.value = value;
  this.sink = sink;
}

Bound$1.prototype.error = Pipe$1.prototype.error;
Bound$1.prototype.event = noop;
Bound$1.prototype.end = noop;
Bound$1.prototype.dispose = noop;

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

LowerBound$1.prototype.end = noop;
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

UpperBound$1.prototype.end = noop;
UpperBound$1.prototype.error = Pipe$1.prototype.error;

UpperBound$1.prototype.dispose = function () {
  return this.disposable.dispose()
};

function noop () {}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * @param {Number} delayTime milliseconds to delay each item
 * @param {Stream} stream
 * @returns {Stream} new stream containing the same items, but delayed by ms
 */
function delay$1 (delayTime, stream) {
  return delayTime <= 0 ? stream
    : new Stream$1(new Delay$1(delayTime, stream.source))
}

function Delay$1 (dt, source) {
  this.dt = dt;
  this.source = source;
}

Delay$1.prototype.run = function (sink, scheduler) {
  var delaySink = new DelaySink$1(this.dt, sink, scheduler);
  return all([delaySink, this.source.run(delaySink, scheduler)])
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
function throttle$1$1 (period, stream) {
  return new Stream$1(throttleSource(period, stream.source))
}

function throttleSource (period, source) {
  return source instanceof Map$2 ? commuteMapThrottle$1(period, source)
    : source instanceof Throttle$1 ? fuseThrottle$1(period, source)
    : new Throttle$1(period, source)
}

function commuteMapThrottle$1 (period, source) {
  return Map$2.create(source.f, throttleSource(period, source.source))
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
function debounce$1$1 (period, stream) {
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
  this.disposable = all([this, sourceDisposable]);
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
function recoverWith$1$1 (f, stream) {
  return new Stream$1(new RecoverWith$1(f, stream.source))
}

var flatMapError = recoverWith$1$1;

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
  tryEvent$2(t, x, this.sink);
};

RecoverWithSink$1.prototype.end = function (t, x) {
  tryEnd$1(t, x, this.sink);
};

RecoverWithSink$1.prototype.error = function (t, e) {
  var nextSink = this.sink.disable();

  tryDispose$2(t, this.disposable, this.sink);
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

var MulticastDisposable$1 = function MulticastDisposable (source, sink) {
  this.source = source;
  this.sink = sink;
  this.disposed = false;
};

MulticastDisposable$1.prototype.dispose = function dispose () {
  if (this.disposed) {
    return
  }
  this.disposed = true;
  var remaining = this.source.remove(this.sink);
  return remaining === 0 && this.source._dispose()
};

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

var dispose = function (disposable) { return disposable.dispose(); };

var emptyDisposable = {
  dispose: function dispose$1 () {}
};

var MulticastSource$1 = function MulticastSource (source) {
  this.source = source;
  this.sinks = [];
  this._disposable = emptyDisposable;
};

MulticastSource$1.prototype.run = function run (sink, scheduler) {
  var n = this.add(sink);
  if (n === 1) {
    this._disposable = this.source.run(this, scheduler);
  }
  return new MulticastDisposable$1(this, sink)
};

MulticastSource$1.prototype._dispose = function _dispose () {
  var disposable = this._disposable;
  this._disposable = emptyDisposable;
  return Promise.resolve(disposable).then(dispose)
};

MulticastSource$1.prototype.add = function add (sink) {
  this.sinks = append$1(sink, this.sinks);
  return this.sinks.length
};

MulticastSource$1.prototype.remove = function remove$1$$1 (sink) {
  var i = findIndex$1$1(sink, this.sinks);
  // istanbul ignore next
  if (i >= 0) {
    this.sinks = remove$1(i, this.sinks);
  }

  return this.sinks.length
};

MulticastSource$1.prototype.event = function event (time, value) {
  var s = this.sinks;
  if (s.length === 1) {
    return s[0].event(time, value)
  }
  for (var i = 0; i < s.length; ++i) {
    tryEvent$3(time, value, s[i]);
  }
};

MulticastSource$1.prototype.end = function end (time, value) {
  var s = this.sinks;
  for (var i = 0; i < s.length; ++i) {
    tryEnd$2(time, value, s[i]);
  }
};

MulticastSource$1.prototype.error = function error (time, err) {
  var s = this.sinks;
  for (var i = 0; i < s.length; ++i) {
    s[i].error(time, err);
  }
};

function multicast$1 (stream) {
  var source = stream.source;
  return source instanceof MulticastSource$1
    ? stream
    : new stream.constructor(new MulticastSource$1(source))
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

// Add of and empty to constructor for fantasy-land compat
Stream$1.of = of;
Stream$1.empty = empty$1;
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
  return loop$1$1(stepper, seed, this)
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
  return scan$1$1(f, initial, this)
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
  return reduce$3(f, initial, this)
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
  return map$4(f, this)
};

/**
 * Assume this stream contains functions, and apply each function to each item
 * in the provided stream.  This generates, in effect, a cross product.
 * @param {Stream} xs stream of items to which
 * @returns {Stream} stream containing the cross product of items
 */
Stream$1.prototype.ap = function (xs) {
  return ap$1$1(this, xs)
};

/**
 * Replace each value in the stream with x
 * @param {*} x
 * @returns {Stream} stream containing items replaced with x
 */
Stream$1.prototype.constant = function (x) {
  return constant$1$1(x, this)
};

/**
 * Perform a side effect for each item in the stream
 * @param {function(x:*):*} f side effect to execute for each item. The
 *  return value will be discarded.
 * @returns {Stream} new stream containing the same items as this stream
 */
Stream$1.prototype.tap = function (f) {
  return tap$1$1(f, this)
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
  return continueWith$1$1(f, this)
};

// @deprecated use continueWith instead
Stream$1.prototype.flatMapEnd = Stream$1.prototype.continueWith;

Stream$1.prototype.concatMap = function (f) {
  return concatMap$1$1(f, this)
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
  return mergeConcurrently$1$1(concurrency, this)
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
  return combineArray$1$1(f, replace(this, 0, arguments))
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
  return sampleArray(f, this, tail(arguments))
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
  return zipArray$1$1(f, replace(this, 0, arguments))
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
  return filter$1$1(p, this)
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
  return skipRepeatsWith$1$1(equals, this)
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
  return take$1$1(n, this)
};

/**
 * stream:          -abcd->
 * skip(2, stream): ---cd->
 * @param {Number} n skip this many events
 * @returns {Stream} stream not containing the first n events
 */
Stream$1.prototype.skip = function (n) {
  return skip$1$1(n, this)
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
  return slice$1$1(start, end, this)
};

/**
 * stream:                        -123451234->
 * takeWhile(x => x < 5, stream): -1234|
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items up to, but not including, the
 * first item for which p returns falsy.
 */
Stream$1.prototype.takeWhile = function (p) {
  return takeWhile$1$1(p, this)
};

/**
 * stream:                        -123451234->
 * skipWhile(x => x < 5, stream): -----51234->
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items following *and including* the
 * first item for which p returns falsy.
 */
Stream$1.prototype.skipWhile = function (p) {
  return skipWhile$1$1(p, this)
};

/**
 * stream:                         -123456789->
 * skipAfter(x => x === 5, stream):-12345|
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items up to, *and including*, the
 * first item for which p returns truthy.
 */
Stream$1.prototype.skipAfter = function (p) {
  return skipAfter(p, this)
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
  return takeUntil(signal, this)
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
  return skipUntil(signal, this)
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
  return during$1$1(timeWindow, this)
};

// -----------------------------------------------------------------------
// Delaying

/**
 * @param {Number} delayTime milliseconds to delay each item
 * @returns {Stream} new stream containing the same items, but delayed by ms
 */
Stream$1.prototype.delay = function (delayTime) {
  return delay$1(delayTime, this)
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
  return throttle$1$1(period, this)
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
  return debounce$1$1(period, this)
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
  return multicast$1(this)
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

  var send = function (e) { return tryEvent$1(scheduler.now(), e, sink); };
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

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// Non-mutating array operations

// cons :: a -> [a] -> [a]
// a with x prepended
// removeAll :: (a -> boolean) -> [a] -> [a]
// remove all elements matching a predicate
function removeAll$1$1 (f, a) {
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
function findIndex$2 (x, a) {
  for (var i = 0, l = a.length; i < l; ++i) {
    if (x === a[i]) {
      return i
    }
  }
  return -1
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var ScheduledTask$2 = function ScheduledTask (time, localOffset, period, task, scheduler) {
  this.time = time;
  this.localOffset = localOffset;
  this.period = period;
  this.task = task;
  this.scheduler = scheduler;
  this.active = true;
};

ScheduledTask$2.prototype.run = function run () {
  return this.task.run(this.time - this.localOffset)
};

ScheduledTask$2.prototype.error = function error (e) {
  return this.task.error(this.time - this.localOffset, e)
};

ScheduledTask$2.prototype.dispose = function dispose () {
  this.scheduler.cancel(this);
  return this.task.dispose()
};

// AbstractScheduler should not be exposed publicly
// Temporary mixin to reduce duplication between
// Scheduler and RelativeScheduler.  Eventually,
// the Scheduler interface will change and this
// can be removed.
var AbstractScheduler$1 = function AbstractScheduler () {};

AbstractScheduler$1.prototype.asap = function asap (task) {
  return this.scheduleTask(0, 0, -1, task)
};

AbstractScheduler$1.prototype.delay = function delay (delay$1, task) {
  return this.scheduleTask(0, delay$1, -1, task)
};

AbstractScheduler$1.prototype.periodic = function periodic (period, task) {
  return this.scheduleTask(0, 0, period, task)
};

AbstractScheduler$1.prototype.schedule = function schedule (delay, period, task) {
  return this.scheduleTask(0, delay, period, task)
};

var RelativeScheduler$1 = (function (AbstractScheduler$$1) {
  function RelativeScheduler (origin, scheduler) {
    AbstractScheduler$$1.call(this);
    this.origin = origin;
    this.scheduler = scheduler;
  }

  if ( AbstractScheduler$$1 ) { RelativeScheduler.__proto__ = AbstractScheduler$$1; }
  RelativeScheduler.prototype = Object.create( AbstractScheduler$$1 && AbstractScheduler$$1.prototype );
  RelativeScheduler.prototype.constructor = RelativeScheduler;

  RelativeScheduler.prototype.now = function now () {
    return this.scheduler.now() - this.origin
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

  return RelativeScheduler;
}(AbstractScheduler$1));

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var defer$2 = function (task) { return Promise.resolve(task).then(runTask$2); };

function runTask$2 (task) {
  try {
    return task.run()
  } catch (e) {
    return task.error(e)
  }
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var Scheduler$1 = (function (AbstractScheduler$$1) {
  function Scheduler (timer, timeline) {
    var this$1 = this;

    AbstractScheduler$$1.call(this);
    this.timer = timer;
    this.timeline = timeline;

    this._timer = null;
    this._nextArrival = Infinity;

    this._runReadyTasksBound = function () { return this$1._runReadyTasks(this$1.now()); };
  }

  if ( AbstractScheduler$$1 ) { Scheduler.__proto__ = AbstractScheduler$$1; }
  Scheduler.prototype = Object.create( AbstractScheduler$$1 && AbstractScheduler$$1.prototype );
  Scheduler.prototype.constructor = Scheduler;

  Scheduler.prototype.now = function now () {
    return this.timer.now()
  };

  Scheduler.prototype.scheduleTask = function scheduleTask (localOffset, delay, period, task) {
    var time = this.now() + Math.max(0, delay);
    var st = new ScheduledTask$2(time, localOffset, period, task, this);

    this.timeline.add(st);
    this._scheduleNextRun();
    return st
  };

  Scheduler.prototype.relative = function relative (offset) {
    return new RelativeScheduler$1(offset, this)
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
    var delay = Math.max(0, nextArrival - this.now());
    this._timer = this.timer.setTimer(this._runReadyTasksBound, delay);
  };

  Scheduler.prototype._runReadyTasks = function _runReadyTasks () {
    this._timer = null;
    this.timeline.runTasks(this.now(), runTask$2);
    this._scheduleNextRun();
  };

  return Scheduler;
}(AbstractScheduler$1));

/** @license MIT License (c) copyright 2010-2017 original author or authors */

var Timeline$2 = function Timeline () {
  this.tasks = [];
};

Timeline$2.prototype.nextArrival = function nextArrival () {
  return this.isEmpty() ? Infinity : this.tasks[0].time
};

Timeline$2.prototype.isEmpty = function isEmpty () {
  return this.tasks.length === 0
};

Timeline$2.prototype.add = function add (st) {
  insertByTime$2(st, this.tasks);
};

Timeline$2.prototype.remove = function remove$$1 (st) {
  var i = binarySearch$2(getTime$1(st), this.tasks);

  if (i >= 0 && i < this.tasks.length) {
    var at = findIndex$2(st, this.tasks[i].events);
    if (at >= 0) {
      this.tasks[i].events.splice(at, 1);
      return true
    }
  }

  return false
};

Timeline$2.prototype.removeAll = function removeAll$$1 (f) {
    var this$1 = this;

  for (var i = 0; i < this.tasks.length; ++i) {
    removeAllFrom$2(f, this$1.tasks[i]);
  }
};

Timeline$2.prototype.runTasks = function runTasks (t, runTask) {
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
        insertByTime$2(task, tasks);
      }
    }
  }

  return tasks
}

function insertByTime$2 (task, timeslots) {
  var l = timeslots.length;
  var time = getTime$1(task);

  if (l === 0) {
    timeslots.push(newTimeslot$2(time, [task]));
    return
  }

  var i = binarySearch$2(time, timeslots);

  if (i >= l) {
    timeslots.push(newTimeslot$2(time, [task]));
  } else {
    insertAtTimeslot$1(task, timeslots, time, i);
  }
}

function insertAtTimeslot$1 (task, timeslots, time, i) {
  var timeslot = timeslots[i];
  if (time === timeslot.time) {
    addEvent$1(task, timeslot.events, time);
  } else {
    timeslots.splice(i, 0, newTimeslot$2(time, [task]));
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

function removeAllFrom$2 (f, timeslot) {
  timeslot.events = removeAll$1$1(f, timeslot.events);
}

function binarySearch$2 (t, sortedArray) { // eslint-disable-line complexity
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

var newTimeslot$2 = function (t, events) { return ({ time: t, events: events }); };

/** @license MIT License (c) copyright 2010-2017 original author or authors */

/*global setTimeout, clearTimeout*/

var ClockTimer$2 = function ClockTimer (clock) {
  this._clock = clock;
};

ClockTimer$2.prototype.now = function now () {
  return this._clock.now()
};

ClockTimer$2.prototype.setTimer = function setTimer (f, dt) {
  return dt <= 0 ? runAsap$2(f) : setTimeout(f, dt)
};

ClockTimer$2.prototype.clearTimer = function clearTimer (t) {
  return t instanceof Asap$2 ? t.cancel() : clearTimeout(t)
};

var Asap$2 = function Asap (f) {
  this.f = f;
  this.active = true;
};

Asap$2.prototype.run = function run () {
  return this.active && this.f()
};

Asap$2.prototype.error = function error (e) {
  throw e
};

Asap$2.prototype.cancel = function cancel () {
  this.active = false;
};

function runAsap$2 (f) {
  var task = new Asap$2(f);
  defer$2(task);
  return task
}

/** @license MIT License (c) copyright 2010-2017 original author or authors */

/*global performance, process*/

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

var clockRelativeTo = function (clock) { return new RelativeClock$1(clock, clock.now()); };

var newPerformanceClock = function () { return clockRelativeTo(performance); };

var newDateClock = function () { return clockRelativeTo(Date); };

var newHRTimeClock = function () { return new HRTimeClock$1(process.hrtime, process.hrtime()); };

var newPlatformClock = function () {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return newPerformanceClock()
  } else if (typeof process !== 'undefined' && typeof process.hrtime === 'function') {
    return newHRTimeClock()
  }

  return newDateClock()
};

var newDefaultScheduler = function () { return new Scheduler$1(newDefaultTimer(), new Timeline$2()); };

var newDefaultTimer = function () { return new ClockTimer$2(newPlatformClock()); };

// @flow
// inputById :: String -> HTMLInputElement
// Type-safe helper to get an HTMLInputElement by id
var inputById = function (id$$1) {
  var el = document.getElementById(id$$1);
  if(!(el instanceof HTMLInputElement)) { throw new Error(("input #" + id$$1 + " not found")) }
  return el
};

// numberValue :: HTMLInputElement -> Behavior Number
var numberValue = compose$1(map$$1(function (input$$1) { return Number(input$$1.value); }), always);

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
var updateFrom = compose$1(tap(render(inputById('z'))), sample$$1(inputEvents));

// Run the app
runEffects(updateFrom(z), newDefaultScheduler());

}());
