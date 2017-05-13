// ------------------------------------------------------
// Event helpers

export const mapWithTime = (f, stream) =>
  new MapWithTimeStream(f, stream)

class MapWithTimeStream {
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

  end (t) {
    this.sink.end(t)
  }
}
