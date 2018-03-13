// @flow
import type { Disposable, Scheduler, Sink, Stream, Time } from '@most/types'
import type { Behavior } from './index'

export const snapshotTime: Behavior<Time> = <A> (stream: Stream<Time => A>): Stream<A> =>
  new SnapshotTime(stream)

class SnapshotTime<A> {
  source: Stream<Time => A>

  constructor (source: Stream<Time => A>) {
    this.source = source
  }

  run (sink: Sink<A>, scheduler: Scheduler): Disposable {
    return this.source.run(new SnapshotTimeSink(sink), scheduler)
  }
}

class SnapshotTimeSink<A> {
  sink: Sink<A>

  constructor (sink: Sink<A>) {
    this.sink = sink
  }

  event (t: Time, f: Time => A): void {
    this.sink.event(t, f(t))
  }

  error (t: Time, e: Error): void {
    this.sink.error(t, e)
  }

  end (t: Time): void {
    this.sink.end(t)
  }
}
