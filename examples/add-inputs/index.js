// @flow
import { always, map, liftA2, sample } from '../../src/index'
import { input } from '@most/dom-event'
import { newDefaultScheduler } from '@most/scheduler'
import { tap, runEffects } from '@most/core'
import { compose } from '@most/prelude'

// inputById :: String -> HTMLInputElement
// Type-safe helper to get an HTMLInputElement by id
const inputById = id => {
  const el = document.getElementById(id)
  if(!(el instanceof HTMLInputElement)) { throw new Error(`input #${id} not found`) }
  return el
}

// numberValue :: HTMLInputElement -> Behavior Number
const numberValue = compose(map(input => Number(input.value)), always)

// add :: Number -> Number -> Number
const add = (x, y) => x + y

// x :: Behavior Number
// x is the value of the #x input at all times
// note that x is not a change event, it's the value over time
const x = numberValue(inputById('x'))

// y :: Behavior Number
// Similarly, y is the value of the #y input at all times
const y = numberValue(inputById('y'))

// z :: Behavior Number
// z is x + y at all times
const z = liftA2(add, x, y)

// inputEvents :: Stream InputEvent
// All the input events that will occur in container
const inputEvents = input(document.getElementById('container'))

// render :: HTMLInputElement -> Number -> void
const render = el => result => el.value = String(result)

// update :: HTMLInputElement -> Stream String
// Sample z at all the instants input events occur in container
// and the value
const update = compose(tap(render(inputById('z'))), sample(inputEvents))

// Run the app
runEffects(update(z), newDefaultScheduler())
