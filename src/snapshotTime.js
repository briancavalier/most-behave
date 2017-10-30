// @flow
import type { Disposable, Scheduler, Sink, Stream, Time } from '@most/types'

export const snapshotTime = <A, B> (f: (Time, A) => B, stream: Stream<A>): Stream<B> =>
  new SnapshotTime(f, stream)

class SnapshotTime<A, B> {
  f: (Time, A) => B
  source: Stream<A>

  constructor (f: (Time, A) => B, source: Stream<A>) {
    this.f = f
    this.source = source
  }

  run (sink: Sink<B>, scheduler: Scheduler): Disposable {
    return this.source.run(new SnapshotTimeSink(this.f, sink), scheduler)
  }
}

class SnapshotTimeSink<A, B> {
  f: (Time, A) => B
  sink: Sink<B>

  constructor (f: (Time, A) => B, sink: Sink<B>) {
    this.f = f
    this.sink = sink
  }

  event (t: Time, x: A): void {
    const f = this.f
    this.sink.event(t, f(t, x))
  }

  error (t: Time, e: Error): void {
    this.sink.error(t, e)
  }

  end (t: Time): void {
    this.sink.end(t)
  }
}
