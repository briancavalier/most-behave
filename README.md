# Behavior

[![Greenkeeper badge](https://badges.greenkeeper.io/briancavalier/most-behave.svg)](https://greenkeeper.io/)

**EXPERIMENTAL** Don't use this for anything real ... yet.

Continuous time-varying values for most.js.  Behaviors are the continuous complement to most.js discrete Event Streams, or, if you prefer, the "pull" complement to most.js "push" Event Streams.

## Try it

Feedback welcome via [gitter](https://gitter.im/cujojs/most), but seriously, don't use it for anything real yet.

```
npm i --save @briancavalier/most-behavior
```

## Behavior

A Behavior is a continuous value.  In contrast to an Event Stream which has discrete occurrences at particular instants in time, a Behavior's value is defined at all *real number* (not integer) values of time and may vary continuously (or not) over time.

Because they are defined for all real number values of time, a Behavior must be *sampled* to obtain its value at specific instants in time.  To sample a Behavior, pass it an Event Stream whose occurrences define all the points in time at which the behavior's value should be sampled.

Here's a simple example.  Note that because `clock` is "pull", it does no work at the instants between clicks, where it is *not* being sampled.

```js
import { time } from '@briancavalier/most-behavior'
import { click } from '@most/dom-event'

// A Behavior that always represents milliseconds since the application started
const clock = time

// Sample the clock each time the user clicks
const timeAtEachClick = sample(clock, click(document))
```

For now, [see the examples dir](examples) for more realistic code, how to run a `@most/core` app that integrates behaviors, etc.

## API

### Creating Behaviors

#### time :: Behavior number

A behavior that represents the current time in milliseconds since the application started.

#### always :: a &rarr; Behavior a

Create a Behavior whose value is always `a`.

#### step :: a &rarr; Stream a &rarr; Behavior a

Create a Behavior that starts with an initial value and updates to each new value in the Event Stream.

### Transforming Behaviors

#### map :: (a &rarr; b) &rarr; Behavior a &rarr; Behavior b

Apply a function to a Behavior at all points in time.

#### apply :: Behavior (a &rarr; b) &rarr; Behavior a &rarr; Behavior b

Apply a (time-varying) function to a Behavior at all points in time.

#### liftA2 :: (a &rarr; b &rarr; c) &rarr; Behavior a &rarr; Behavior b &rarr; Behavior c

Apply a function to 2 Behaviors at all points in time.

### Sampling Behaviors

#### sample :: Behavior a &rarr; Stream b &rarr; Stream a

Sample a Behavior's value at every occurrence of an Event Stream.

#### snapshot :: Behavior a &rarr; Stream b &rarr; Stream [a, b]

Sample a Behavior at every occurrence of an event, and compute a new event from the (event, sample) pair.

## Potential APIs

Potentially useful APIs we could add:

### when :: Behavior bool &rarr; Stream a &rarr; Stream a

Allow events only when a Behavior's value is `true`.

### accum :: a &rarr; Stream (a &rarr; a) &rarr; Behavior a

Create a Behavior with an initial value and an Event Stream carrying update functions.

### scanB :: (a &rarr; b &rarr; a) &rarr; a &rarr; Stream b &rarr; Behavior a

Like scan, but produces a Behavior.  Needs a helpful name ...

### scanB :: (a &rarr; b &rarr; Behavior a) &rarr; Behavior a &rarr; Stream b &rarr; Behavior b

Generalized scan for Behaviors.  When event occurs, sample Behavior, and apply a function that creates a new Behavior.  Somewhat like `switch`.  Needs a helpful name ...

### count :: Stream a &rarr; Behavior number

Create a Behavior representing the number of event occurrences.

### switch :: Behavior a &rarr; Stream (Behavior a) &rarr; Behavior a

Create a Behavior that acts like an initial Behavior and switches to act like each new Behavior that occurs in the Event Stream.
