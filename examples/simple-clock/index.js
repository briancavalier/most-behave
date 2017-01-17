import { time, map, sample } from '../../src/index'
import { periodic, map as mapE, filter, switchLatest, startWith, tap, runEffects, newDefaultScheduler } from '@most/core'
import { click } from '@most/dom-event'

// DOM Event helpers
const matches = selector => e => e.target.matches(selector)
const getValue = e => e.target.value

// Formatting
const toDate = ms => new Date(ms)
const pad = n => n < 10 ? `0${Math.floor(n)}` : `${Math.floor(n)}`
const render = el => date =>
  el.innerText = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}:${pad(date.getMilliseconds()/10)}`

// We'll put the clock here
const el = document.getElementById('app')

// Map button clicks to a periodic event stream we'll use to sample
// the current time
const clicks = filter(matches('button'), click(document))
const sampler = switchLatest(mapE(periodic, startWith(1000, mapE(Number, mapE(getValue, clicks)))))

// Sample time at some interval and display it
runEffects(tap(render(el), sample(sampler, map(toDate, time))), newDefaultScheduler())
