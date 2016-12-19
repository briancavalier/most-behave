import { time, map, sample } from '../../src/index'
import { periodic } from 'most'

// formatting
const toDate = ms => new Date(ms)
const pad = n => n < 10 ? `0${Math.floor(n)}` : `${Math.floor(n)}`
const render = el => date =>
  el.innerText = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}:${pad(date.getMilliseconds()/10)}`

// We'll put the clock here
const el = document.getElementById('app')

// Sample time at some interval and display it
sample(periodic(10), map(toDate, time)).observe(render(el))
