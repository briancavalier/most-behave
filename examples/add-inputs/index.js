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
const x = numberValue(inputById('x'))

// y :: Behavior Number
const y = numberValue(inputById('y'))

// z :: Behavior Number
// z is x + y at all points in time
const z = liftA2(add, x, y)

// inputEvents :: Stream InputEvent
const inputEvents = input(document.getElementById('container')).source

// render :: HTMLInputElement -> Number -> void
const render = el => result => el.value = String(result)

// update :: HTMLInputElement -> Stream String
const update = compose(tap(render(inputById('z'))), sample(inputEvents))

// Run the app
runEffects(update(z), newDefaultScheduler())
