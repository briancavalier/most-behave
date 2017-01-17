// ------------------------------------------------------
// Event helpers

export const mapWithTimeE = (f, stream) => new stream.constructor({
  run (sink, scheduler) {
    return stream.source.run(new MapWithTimeSink(f, sink), scheduler)
  }
})

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
