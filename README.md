# Behavior

**EXPERIMENTAL** Don't use this for anything real ... yet.

Continuous time-varying values for most.js.  Behaviors are the continuous complement to most.js discrete Event Streams, or, if you prefer, the "pull" complement to most.js "push" Event Streams.

## Behavior

A Behavior is a continuous value.  In contrast to an Event Stream which has discrete occurrences at particular instants in time, a Behavior's value is defined at all *real number* (not integer) values of time and may vary continuously (or not) over time.

Because they are defined for all real number values of time, a Behavior must be *sampled* to obtain its value at specific instants in time.  To sample a Behavior, pass it an Event Stream whose occurrences define all the points in time at which the behavior's value should be sampled.

Here's a simple example.  Note that because `clock` is "pull", it does no work at the instants between clicks, where it is *not* being sampled.

```js
import { time } from '@most/behave'
import { click } from '@most/dom-event'

// A Behavior that always represents milliseconds since the application started
const clock = time

// Sample the clock each time the user clicks
const timeAtEachClick = sample(click(document), clock)
```

## API

### always :: a &rarr; Behavior a

Create a Behavior whose value is always `a`.

### fromStream :: a &rarr; Stream a &rarr; Behavior a

Create a Behavior that starts with an initial value and updates to each new value in the Event Stream.

### map :: (a &rarr; b) &rarr; Behavior a &rarr; Behavior b

Apply a function to a Behavior at all points in time.

### liftA2 :: (a &rarr; b &rarr; c) &rarr; Behavior a &rarr; Behavior b &rarr; Behavior c

Apply a function to 2 Behaviors at all points in time.

### sample :: Stream a &rarr; Behavior b &rarr; Stream b

Sample a Behavior's value at every occurrence of an Event Stream.

### snapshot :: (a &rarr; b &rarr; c) &rarr; Stream a &rarr; Behavior b &rarr; Stream c

Sample a Behavior at every occurrence of an event, and compute a new event from the (event, sample) pair.

## Potential APIs

Potentially useful APIs we could add:

### when :: Behavior bool &rarr; Stream a &rarr; Stream a

Allow events only when a Behavior's value is `true`.

### accum :: a &rarr; Stream (a &rarr; a) &rarr; Behavior a

Create a Behavior with an initial value and an Event Stream carrying update functions.

### accum :: (a &rarr; b &rarr; a) &rarr; a &rarr; Stream b &rarr; Behavior a

Like scan, but produces a Behavior.

### count :: Stream a &rarr; Behavior number

Create a Behavior representing the number of event occurrences.

### switch :: Behavior a &rarr; Stream (Behavior a) &rarr; Behavior a

Create a Behavior that acts like an initial Behavior and switches to act like each new Behavior that occurs in the Event Stream.
