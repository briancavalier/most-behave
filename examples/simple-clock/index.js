// @flow
import { time, map, sample } from '../../src/index'
import { periodic, map as mapE, filter, switchLatest, startWith, tap, runEffects } from '@most/core'
import { newDefaultScheduler } from '@most/scheduler'
import { click } from '@most/dom-event'

// DOM Event helpers
const matches = selector => e => e.target.matches(selector)
const getValue = e => e.target.value

// Formatting
const render = el => ms =>
  el.innerText = `${(ms / 1000).toFixed(3)}`

// We'll put the clock here
const el = document.getElementById('app')
// Since getElementById may return null, flow rigthly thinks el may be null
if(!el) { throw new Error('#app element missing') }

// Map button clicks to a periodic event stream we'll use to sample
// the current time
const clicks = filter(matches('button'), click(document))
const sampler = switchLatest(mapE(periodic, startWith(1000, mapE(Number, mapE(getValue, clicks)))))

// Sample time at some interval and display it
runEffects(tap(render(el), sample(sampler, time)), newDefaultScheduler())
