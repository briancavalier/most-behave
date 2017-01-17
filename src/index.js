import { zip, constant, map as mapE, startWith, sample as sampleE } from '@most/core'
import multicast from '@most/multicast'
import { curry2, curry3 } from '@most/prelude'
import { mapWithTimeE } from './event'

// Possibly useful:
// - accum :: a -> Event (a -> a) -> Behavior a
//    accum :: (a -> b -> c) -> a -> Event b -> Behavior c
// - count :: Event a -> Behavior number
// - when :: Behavior bool -> Event a -> Event a

export const sample = curry2((event, behavior) => behavior.sample(event))

export const snapshot = curry3((f, event, behavior) => behavior.snapshot(f, event))

// Base Behavior typeclass
// Implementations MUST define at least one of sample or snapshot, and
// MAY define both as an optimization
class Behavior {
  sample (event) {
    return this.snapshot(snd, event)
  }

  snapshot (f, event) {
    const me = multicast(event)
    return sampleE(f, this.sample(me), me)
  }
}

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

class Computed extends Behavior {
  constructor (f) {
    super()
    this.f = f
  }

  sample (event) {
    return mapWithTimeE(this.f, event)
  }

  snapshot (g, event) {
    const f = this.f
    return mapWithTimeE((t, a) => g(a, f(t, a)), event)
  }
}

const getTime = (t, x) => t
export const time = new Computed(getTime)

export const stepper = curry2((initial, updateEvent) =>
  new Stepper(startWith(initial, updateEvent)))

const snd = (a, b) => b

class Stepper extends Behavior {
  constructor (updates) {
    super()
    this.updates = updates
  }

  sample (event) {
    return sampleE(snd, event, this.updates)
  }

  snapshot (f, event) {
    return sampleE(f, event, this.updates)
  }
}

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

export const liftA2 = curry3((f, b1, b2) => new LiftA2(f, b1, b2))

class LiftA2 extends Behavior {
  constructor (f, b1, b2) {
    super()
    this.f = f
    this.b1 = b1
    this.b2 = b2
  }

  sample (event) {
    const s = multicast(event)
    return zip(this.f, this.b1.sample(s), this.b2.sample(s))
  }
}
