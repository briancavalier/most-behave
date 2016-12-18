import { always, map, liftA2, sample } from '../../src/index'
import { input } from '@most/dom-event'

const pipe = (f, g) => x => g(f(x))
const byId = id => document.getElementById(id)

const add = (x, y) => x + y

const numberValue = pipe(always, map(pipe(input => input.value, Number)))

const x = numberValue(byId('x'))
const y = numberValue(byId('y'))
const z = liftA2(add, x, y)

const inputEvents = input(byId('container'))

const render = el => result => el.value = result

sample(inputEvents, z).observe(render(byId('z')))
