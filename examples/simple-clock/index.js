// @flow
import type { Stream, Time } from '@most/types'
import { time, sample } from '../../src'
import { periodic, mergeArray, constant, switchLatest, startWith, tap, runEffects } from '@most/core'
import { newDefaultScheduler } from '@most/scheduler'
import { click } from '@most/dom-event'

// DOM Event helpers
const fail = s => { throw new Error(s) }
const qs = s => document.querySelector(s) || fail(`${s} not found`)

// Each button click is a higher-order event stream carrying a periodic
// event stream representing a sample rate value. The event values are
// all void because they don't matter. What matters is the *rate* at
// which they occur, as that will be used to sample the current elapsed time.
const click10ms: Stream<Stream<void>> = constant(periodic(10), click(qs('[name="10ms"]')))
const click100ms: Stream<Stream<void>> = constant(periodic(100), click(qs('[name="100ms"]')))
const click1s: Stream<Stream<void>> = constant(periodic(1000), click(qs('[name="1s"]')))

const clicks: Stream<Stream<void>> = mergeArray([click10ms, click100ms, click1s])

// Each time a button is clicked, switch to its associated sampling rate.
// Start the app with one second sampling rate, i.e., before any buttons
// have been clicked.
const sampler: Stream<void> = switchLatest(startWith(periodic(1000), clicks))

// Get the elapsed time by sampling time() at the associated rate each
// time a button is clicked.
const elapsed: Stream<Time> = sample(time(), sampler)

// Render output
const render = el => ms =>
  el.innerText = `${(ms / 1000).toFixed(3)} seconds`

// We'll put the clock here
const el = qs('#app')

// Sample time at some interval and display it
runEffects(tap(render(el), elapsed), newDefaultScheduler())
