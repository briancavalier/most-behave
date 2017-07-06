import { disposeNone } from '@most/disposable'

export const split = stream => {
  const sp = new SplitStream(stream)
  return [sp, sp]
}

const nullSink = {
  event (t, x) {},
  end (t) {},
  error (t, x) {}
}

class SplitDisposable {
  constructor (source, sink) {
    this.source = source
    this.sink = sink
  }

  dispose () {
    if (this.sink === this.source.sink0) {
      this.source.sink0 = this.source.sink1
      this.source.sink1 = nullSink
    } else {
      this.source.sink1 = nullSink
    }

    if (this.source.sink0 === nullSink) {
      return this.source.disposable.dispose()
    }
  }
}

class SplitStream {
  constructor (source) {
    this.source = source
    this.sink0 = nullSink
    this.sink1 = nullSink
    this.disposable = disposeNone()
  }

  run (sink, scheduler) {
    if (this.sink0 === nullSink) {
      this.sink0 = sink
      this.disposable = this.source.run(this, scheduler)
    } else if (this.sink1 === nullSink) {
      this.sink1 = sink
    } else {
      throw new TypeError('> 2 observers')
    }

    return new SplitDisposable(this, sink)
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

  end (time) {
    this.sink0.end(time)
    this.sink1.end(time)
  }

  error (time, err) {
    this.sink0.error(time, err)
    this.sink1.error(time, err)
  }
}
