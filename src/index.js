// @flow
import type { Stream, Time } from '@most/types'
import { snapshot as snapshotStream, now, multicast, zip } from '@most/core'
import { snapshotTime } from './snapshotTime'

type Behavior <A> = <B, C> ((A, B) => C, Stream<B>) => Stream<C> // eslint-disable-line

export const sample = <A, B> (b: Behavior<A>, s: Stream<B>): Stream<A> =>
  snapshot((a, b) => a, b, s)

export const snapshot = <A, B, C> (f: (A, B) => C, b: Behavior<A>, s: Stream<B>): Stream<C> =>
  b(f, s)

export const time = (): Behavior<Time> =>
  snapshotTime

export const always = <A> (a: A): Behavior<A> =>
  step(now(a))

export const fromTime = <A> (f: Time => A): Behavior<A> =>
  map(f, time())

export const step = <A> (sa: Stream<A>): Behavior<A> =>
  <B, C> (f: (A, B) => C, sb: Stream<B>): Stream<C> =>
    snapshotStream(f, sa, sb)

export const map = <A, B> (f: A => B, b: Behavior<A>): Behavior<B> =>
  <C, D> (g: (B, C) => D, s: Stream<C>): Stream<D> =>
    snapshot((a, c) => g(f(a), c), b, s)

export const apply = <A, B> (bf: Behavior<A => B>, ba: Behavior<A>): Behavior<B> =>
  liftA2((f, a) => f(a), bf, ba)

export const liftA2 = <A, B, C> (f: (A, B) => C, ba: Behavior<A>, bb: Behavior<B>): Behavior<C> =>
  <D, E> (g: (C, D) => E, s: Stream<D>): Stream<E> => {
    const ms = multicast(s)
    return snapshotStream(g, zip(f, sample(ba, ms), sample(bb, ms)), ms)
  }
