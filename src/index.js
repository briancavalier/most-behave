import { zip, constant, map as mapE, startWith, sampleWith, timestamp } from 'most'
import multicast from '@most/multicast'
import { curry2, curry3 } from '@most/prelude'

// Possibly useful:
// 1. snapshot :: (a -> b -> c) -> Event a -> Behavior b -> Event c
// 2. accum :: a -> Event (a -> a) -> Behavior a
//    accum :: (a -> b -> c) -> a -> Event b -> Behavior c
// 3. count :: Event a -> Behavior number
// 4. when :: Behavior bool -> Event a -> Event a

export const sample = curry2((event, behavior) => behavior.sample(event))

export const always = x => new Constant(x)

class Constant {
  constructor (value) {
    this.value = value
  }

  sample (stream) {
    return constant(this.value, stream)
  }
}

class Computed {
  constructor (f) {
    this.f = f
  }

  sample (stream) {
    return mapE(this.f, timestamp(stream))
  }
}

const getTime = ({ time }) => time
export const time = new Computed(getTime)

export const stepper = curry2((initial, updates) =>
  new Stepper(startWith(initial, updates)))

class Stepper {
  constructor (updates) {
    this.updates = updates
  }

  sample (stream) {
    return sampleWith(stream, this.updates)
  }
}

export const map = curry2((f, behavior) => new Map(f, behavior))

class Map {
  constructor (f, behavior) {
    this.f = f
    this.behavior = behavior
  }

  sample (stream) {
    return mapE(this.f, this.behavior.sample(stream))
  }
}

export const liftA2 = curry3((f, b1, b2) => new LiftA2(f, b1, b2))

class LiftA2 {
  constructor (f, b1, b2) {
    this.f = f
    this.b1 = b1
    this.b2 = b2
  }

  sample (stream) {
    const s = multicast(stream)
    return zip(this.f, this.b1.sample(s), this.b2.sample(s))
  }
}
