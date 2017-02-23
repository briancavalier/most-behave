import { Queue } from './queue'
// ------------------------------------------------------
// Event helpers

export const mapWithTimeE = (f, stream) =>
  new stream.constructor(new MathWithTimeSource(f, stream.source))

class MathWithTimeSource {
  constructor (f, source) {
    this.f = f
    this.source = source
  }

  run (sink, scheduler) {
    return this.source.run(new MapWithTimeSink(this.f, sink), scheduler)
  }
}

class MapWithTimeSink {
  constructor (f, sink) {
    this.f = f
    this.sink = sink
  }

  event (t, x) {
    const f = this.f
    this.sink.event(t, f(t, x))
  }

  error (t, e) {
    this.sink.error(t, e)
  }

  end (t, x) {
    this.sink.end(t, x)
  }
}

export const zip2E = (f, s1, s2) =>
  new s1.constructor(new Zip2Source(f, s1.source, s2.source))

class Zip2Source {
  constructor(f, s1, s2) {
    this.f = f
    this.s1 = s1
    this.s2 = s2
  }

  run(sink, scheduler) {
    const state = { active: 2 }
    const q1 = new Queue()
    const q2 = new Queue()
    const d1 = this.s1.run(new Zip2LSink(this.f, q1, q2, state, sink), scheduler)
    const d2 = this.s2.run(new Zip2RSink(this.f, q2, q1, state, sink), scheduler)
    return new DisposeBoth(d1, d2)
  }
}

class Zip2LSink {
  constructor(f, values, other, state, sink) {
    this.f = f
    this.values = values
    this.other = other
    this.state = state
    this.sink = sink
  }

  event(t, x) {
    if (this.other.isEmpty()) {
      this.values.push(x)
    } else {
      this._event(t, x)
    }
  }

  end(t, x) {
    if (--this.state.active === 0) {
      this.sink.end(t, x)
    }
  }

  error (t, e) {
    this.sink.error(t, e)
  }

  _event(t, a) {
    const f = this.f
    this.sink.event(t, f(a, this.other.shift()))
  }
}

class Zip2RSink extends Zip2LSink {
  constructor(f, values, other, state, sink) {
    super(f, values, other, state, sink)
  }

  _event(t, b) {
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
    return Promise.all([this.d1.dispose(), this.d2.dispose()])
  }
}


export const splitE = stream => {
  const sp = new stream.constructor(new SplitSource(stream.source))
  return [sp, sp]
}

const nullSink = {
  event (t, x) {},
  end (t, x) {},
  error (t, x) {}
}

const nullDisposable = {
  dispose () {}
}

class SplitSource {
  constructor (source) {
    this.source = source
    this.sink0 = nullSink
    this.sink1 = nullSink
    this.disposable = nullDisposable
  }

  run (sink, scheduler) {
    if (this.sink0 === nullSink) {
      this.sink0 = sink
      this.disposable = this.source.run(this, scheduler)
      return {
        source: this,
        dispose () {
          this.source.sink0 = source.sink1
          this.source.sink1 = nullSink
          if(this.source.sink0 === nullSink) {
            return this.source.disposable.dispose()
          }
        }
      }
    } else if (this.sink1 === nullSink) {
      this.sink1 = sink
      return {
        source: this,
        dispose () {
          this.source.sink1 = nullSink
          if(this.source.sink0 === nullSink) {
            return this.source.disposable.dispose()
          }
        }
      }
    } else {
      throw new TypeError('> 2 observers')
    }
  }

  _dispose () {
    const disposable = this._disposable
    this._disposable = nullDisposable
    return disposable.dispose()
  }

  event (time, value) {
    this.sink0.event(time, value)
    this.sink1.event(time, value)
  }

  end (time, value) {
    this.sink0.end(time, value)
    this.sink1.end(time, value)
  }

  error (time, err) {
    this.sink0.error(time, err)
    this.sink1.error(time, err)
  }
}
