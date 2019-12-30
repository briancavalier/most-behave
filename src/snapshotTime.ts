import { Disposable, Scheduler, Sink, Stream, Time } from '@most/types'
import { Behavior } from './index'

export const snapshotTime: Behavior<Time> = <A>(stream: Stream<A>): Stream<[Time, A]> => new SnapshotTime(stream)

class SnapshotTime<A> {
  source: Stream<A>

  constructor(source: Stream<A>) {
    this.source = source
  }

  run(sink: Sink<[Time, A]>, scheduler: Scheduler): Disposable {
    return this.source.run(new SnapshotTimeSink(sink), scheduler)
  }
}

class SnapshotTimeSink<A> {
  sink: Sink<[Time, A]>

  constructor(sink: Sink<[Time, A]>) {
    this.sink = sink
  }

  event(t: Time, a: A): void {
    this.sink.event(t, [t, a])
  }

  error(t: Time, e: Error): void {
    this.sink.error(t, e)
  }

  end(t: Time): void {
    this.sink.end(t)
  }
}
