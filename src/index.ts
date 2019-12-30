import { Stream, Time } from '@most/types'
import { snapshot as snapshotStream, map as mapS, startWith } from '@most/core'
import { snapshotTime } from './snapshotTime'

export type Behavior<A> = <B>(s: Stream<B>) => Stream<[A, B]>

export const snapshot = <A, B>(b: Behavior<A>, s: Stream<B>): Stream<[A, B]> => b(s)

export const sample = <A, B>(b: Behavior<A>, s: Stream<B>): Stream<A> => mapS((ab: [A, B]) => ab[0], snapshot(b, s))

export { snapshotTime as time }

export const always = <A>(a: A): Behavior<A> => <B>(sb: Stream<B>): Stream<[A, B]> => mapS((b: B) => [a, b], sb)

export const fromTime = <A>(f: (t: Time) => A): Behavior<A> => map(f, snapshotTime)

export const step = <A>(a: A, sa: Stream<A>): Behavior<A> => <B>(sb: Stream<B>): Stream<[A, B]> =>
  snapshotStream((a: A, b: B) => [a, b], startWith(a, sa), sb)

export const map = <A, B>(f: (a: A) => B, ba: Behavior<A>): Behavior<B> => <C>(sc: Stream<C>): Stream<[B, C]> =>
  mapS(([a, c]: [A, C]) => [f(a), c], snapshot(ba, sc))

export const apply = <A, B>(bf: Behavior<(a: A) => B>, ba: Behavior<A>): Behavior<B> => liftA2((f, a) => f(a), bf, ba)

export const liftA2 = <A, B, C>(f: (a: A, b: B) => C, ba: Behavior<A>, bb: Behavior<B>): Behavior<C> => <D>(
  sd: Stream<D>
): Stream<[C, D]> => mapS(([a, [b, d]]: [A, [B, D]]) => [f(a, b), d], snapshot(ba, snapshot(bb, sd)))
