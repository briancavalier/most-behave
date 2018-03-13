import { Stream, Time } from '@most/types'

export type Behavior <A> = <B> (s: Stream<B>) => Stream<[A, B]>

export function snapshot <A, B> (b: Behavior<A>, s: Stream<B>): Stream<[A, B]>
export function sample <A, B> (b: Behavior<A>, s: Stream<B>): Stream<A>

export var time: Behavior<Time>
export function always <A> (a: A): Behavior<A>
export function fromTime <A> (f: (t: Time) => A): Behavior<A>
export function step <A> (a: A, ea: Stream<A>): Behavior<A>

export function map <A, B> (f: (a: A) => B, ba: Behavior<A>): Behavior<B>

export function apply <A, B> (ba: Behavior<(a: A) => B>, bb: Behavior<A>): Behavior<B>

export function liftA2 <A, B, C> (f: (a: A, b: B) => C, ba: Behavior<A>, bb: Behavior<B>): Behavior<C>
