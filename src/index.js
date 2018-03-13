// @flow
import type { Stream, Time } from '@most/types'
import { snapshot as snapshotStream, now, map as mapS } from '@most/core'
import { id, compose } from '@most/prelude'
import { snapshotTime } from './snapshotTime'

export type Behavior <A> = <B> (Stream<A => B>) => Stream<B>

export const snapshot = <A, B> (b: Behavior<A>, s: Stream<A => B>): Stream<B> =>
  b(s)

export const sample = <A, B> (b: Behavior<A>, s: Stream<B>): Stream<A> =>
  snapshot(b, mapS(_ => id, s))

export { snapshotTime as time }

export const always = <A> (a: A): Behavior<A> =>
  <B> (s: Stream<A => B>): Stream<B> =>
    mapS(f => f(a), s)

export const fromTime = <A> (f: Time => A): Behavior<A> =>
  map(f, snapshotTime)

export const step = <A> (a: A, sa: Stream<A>): Behavior<A> =>
  <B> (sab: Stream<A => B>): Stream<B> =>
    snapshotStream((a, f) => f(a), sa, sab)

export const map = <A, B> (f: A => B, ba: Behavior<A>): Behavior<B> =>
  <C> (sbc: Stream<B => C>): Stream<C> =>
    snapshot(ba, mapS(bc => compose(bc, f), sbc))

export const apply = <A, B> (bf: Behavior<A => B>, ba: Behavior<A>): Behavior<B> =>
  liftA2((f, a) => f(a), bf, ba)

export const liftA2 = <A, B, C> (f: (A, B) => C, ba: Behavior<A>, bb: Behavior<B>): Behavior<C> =>
  <D> (scd: Stream<C => D>): Stream<D> =>
    snapshot(bb, snapshot(ba, mapS(cd => (a => b => cd(f(a, b))), scd)))
