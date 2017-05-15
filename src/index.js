import { constant, map as mapE, startWith, sample as sampleE } from '@most/core'
import { curry2, curry3 } from '@most/prelude'
import { mapWithTime, zip2, split } from './event'

// Possibly useful:
// - accum :: a -> Event (a -> a) -> Behavior a
// - accum :: (a -> b -> c) -> a -> Event b -> Behavior c
// - count :: Event a -> Behavior number
// - when :: Behavior bool -> Event a -> Event a

// sample :: Event a -> Behavior b -> Event b
// Sample a behavior at all the event times
// Returns a new event stream whose events occur at the same
// times as the input event stream, and whose values are
// sampled from the behavior
export const sample = curry2((event, behavior) => behavior.sample(event))

// snapshot :: (a -> b -> c) -> Event a -> Behavior b -> Event c
// Apply a function to each event value and the behavior's
// value, sampled at the time of the event.  Returns a new
// event stream whose events occur at the same times as the
// input event stream, and whose values are the result of
// applying the function
export const snapshot = curry3((f, event, behavior) => behavior.snapshot(f, event))

// Base Behavior typeclass
// Implementations:
// - MUST define at least one of sample or snapshot
// - MAY define both as an optimization
class Behavior {
  sample (event) {
    return this.snapshot(snd, event)
  }

  snapshot (f, event) {
    const [e1, e2] = split(event)
    return sampleE(f, this.sample(e1), e2)
  }
}

// always :: a -> Behavior a
// A behavior whose value never varies
export const always = x => new Constant(x)

class Constant extends Behavior {
  constructor (value) {
    super()
    this.value = value
  }

  sample (event) {
    return constant(this.value, event)
  }

  snapshot (f, event) {
    return mapE(a => f(a, this.value), event)
  }
}

// computed :: (Time -> a -> b) -> Behavior b
// A behavior computed by applying a function to the
// event occurrence times and values that are used to
// sample it
export const computed = f => new Computed(f)

class Computed extends Behavior {
  constructor (f) {
    super()
    this.f = f
  }

  sample (event) {
    return mapWithTime(this.f, event)
  }

  snapshot (g, event) {
    const f = this.f
    return mapWithTime((t, a) => g(a, f(t, a)), event)
  }
}

// time :: Behavior Time
// A behavior whose value is the current time, as reported
// by whatever scheduler is in use (not wall clock time)
export const time = computed((t, _) => t)

// step :: a -> Event a -> Behavior a
// A behavior that starts with an initial value, and then
// changes discretely to the value of each update event.
export const step = curry2((initial, updateEvent) =>
  new Step(startWith(initial, updateEvent)))

const snd = (a, b) => b

class Step extends Behavior {
  constructor (updates) {
    super()
    this.updates = updates
  }

  snapshot (f, event) {
    return sampleE(f, event, this.updates)
  }
}

// map :: (a -> b) -> Behavior a -> Behavior b
// Transform the behavior's value at all points in time
export const map = curry2((f, behavior) => new Map(f, behavior))

class Map extends Behavior {
  constructor (f, behavior) {
    super()
    this.f = f
    this.behavior = behavior
  }

  sample (event) {
    return mapE(this.f, this.behavior.sample(event))
  }

  snapshot (g, event) {
    const f = this.f
    return this.behavior.snapshot((a, b) => g(a, f(b)), event)
  }
}

// liftA2 :: (a -> b -> c) -> Behavior a -> Behavior a -> Behavior c
// Apply a function to 2 Behaviors.  Effectively lifts a 2-arg function
export const liftA2 = curry3((f, b1, b2) => new LiftA2(f, b1, b2))

class LiftA2 extends Behavior {
  constructor (f, b1, b2) {
    super()
    this.f = f
    this.b1 = b1
    this.b2 = b2
  }

  sample (event) {
    const [e1, e2] = split(event)
    return zip2(this.f, this.b1.sample(e1), this.b2.sample(e2))
  }
}
