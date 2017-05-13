import { Queue } from './queue'

export const zip2 = (f, s1, s2) =>
  new Zip2Stream(f, s1, s2)

class Zip2Stream {
  constructor (f, s1, s2) {
    this.f = f
    this.s1 = s1
    this.s2 = s2
  }

  run (sink, scheduler) {
    const state = { active: 2 }
    const q1 = new Queue()
    const q2 = new Queue()
    const d1 = this.s1.run(new Zip2LSink(this.f, q1, q2, state, sink), scheduler)
    const d2 = this.s2.run(new Zip2RSink(this.f, q2, q1, state, sink), scheduler)
    return new DisposeBoth(d1, d2)
  }
}

class Zip2LSink {
  constructor (f, values, other, state, sink) {
    this.f = f
    this.values = values
    this.other = other
    this.state = state
    this.sink = sink
  }

  event (t, x) {
    if (this.other.isEmpty()) {
      this.values.push(x)
    } else {
      this._event(t, x)
    }
  }

  end (t) {
    if (--this.state.active === 0) {
      this.sink.end(t)
    }
  }

  error (t, e) {
    this.sink.error(t, e)
  }

  _event (t, a) {
    const f = this.f
    this.sink.event(t, f(a, this.other.shift()))
  }
}

class Zip2RSink extends Zip2LSink {
  _event (t, b) {
    const f = this.f
    this.sink.event(t, f(this.other.shift(), b))
  }
}

class DisposeBoth {
  constructor (d1, d2) {
    this.d1 = d1
    this.d2 = d2
  }

  dispose () {
    this.d1.dispose()
    this.d2.dispose()
  }
}
