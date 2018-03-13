// @flow
import type { Stream, Time } from '@most/types'
import { snapshot as snapshotStream, now, map as mapS } from '@most/core'
import { snapshotTime } from './snapshotTime'

export type Behavior <A> = <B> (Stream<B>) => Stream<[A, B]>

export const snapshot = <A, B> (b: Behavior<A>, s: Stream<B>): Stream<[A, B]> =>
  b(s)

export const sample = <A, B> (b: Behavior<A>, s: Stream<B>): Stream<A> =>
  mapS(([a, _]) => a, snapshot(b, s))

export { snapshotTime as time }

export const always = <A> (a: A): Behavior<A> =>
  step(now(a))

export const fromTime = <A> (f: Time => A): Behavior<A> =>
  map(f, snapshotTime)

export const step = <A> (sa: Stream<A>): Behavior<A> =>
  <B> (sb: Stream<B>): Stream<[A, B]> =>
    snapshotStream((a, b) => [a, b], sa, sb)

export const map = <A, B> (f: A => B, ba: Behavior<A>): Behavior<B> =>
  <C> (sc: Stream<C>): Stream<[B, C]> =>
    mapS(([a, c]) => [f(a), c], snapshot(ba, sc))

export const apply = <A, B> (bf: Behavior<A => B>, ba: Behavior<A>): Behavior<B> =>
  liftA2((f, a) => f(a), bf, ba)

export const liftA2 = <A, B, C> (f: (A, B) => C, ba: Behavior<A>, bb: Behavior<B>): Behavior<C> =>
  <D> (sd: Stream<D>): Stream<[C, D]> =>
    mapS(([a, [b, d]]) => [f(a, b), d], snapshot(ba, snapshot(bb, sd)))
