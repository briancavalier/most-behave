import { Stream } from '@most/types'

type Time = number

export type Behavior<A> = {
  sample <B> (e: Stream<B>): Stream<A>,
  snapshot <B, C> (f: (b: B, a: A) => C, eb: Stream<B>): Stream<C>
}

export function sample <A, B> (ea: Stream<A>, bb: Behavior<B>): Stream<B>
export function sample <A, B> (ea: Stream<A>): (bb: Behavior<B>) => Stream<B>

export function snapshot <A, B, C> (f: (a: A, b: B) => C, ea: Stream<A>, bb: Behavior<B>): Stream<C>
export function snapshot <A, B, C> (f: (a: A, b: B) => C): (ea: Stream<A>, bb: Behavior<B>) => Stream<C>
export function snapshot <A, B, C> (f: (a: A, b: B) => C, ea: Stream<A>): (bb: Behavior<B>) => Stream<C>
export function snapshot <A, B, C> (f: (a: A, b: B) => C): (ea: Stream<A>) => (bb: Behavior<B>) => Stream<C>

export function always <A> (a: A): Behavior<A>

export var time: Behavior<Time>

export function fromStream <A> (a: A, ea: Stream<A>): Behavior<A>
export function fromStream <A> (a: A): (ea: Stream<A>) => Behavior<A>

export function map <A, B> (f: (a: A) => B, ba: Behavior<A>): Behavior<B>
export function map <A, B> (f: (a: A) => B): (ba: Behavior<A>) => Behavior<B>

export function liftA2 <A, B, C> (f: (a: A, b: B) => C, ba: Behavior<A>, bb: Behavior<B>): Behavior<C>
export function liftA2 <A, B, C> (f: (a: A, b: B) => C): (ba: Behavior<A>, bb: Behavior<B>) => Behavior<C>
export function liftA2 <A, B, C> (f: (a: A, b: B) => C, ba: Behavior<A>): (bb: Behavior<B>) => Behavior<C>
export function liftA2 <A, B, C> (f: (a: A, b: B) => C): (ba: Behavior<A>) => (bb: Behavior<B>) => Behavior<C>
