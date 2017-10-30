// @flow
import type { Stream, Time } from '@most/types'
import { time, snapshot } from '../../src'
import { scan, merge, skip, constant, map, tap, runEffects } from '@most/core'
import { newDefaultScheduler } from '@most/scheduler'
import { click } from '@most/dom-event'
import { compose } from '@most/prelude'

type TimeAndValue<A> = {
  time: Time,
  value: A
}

type TimeAndLetter = TimeAndValue<string>

type CodeAndElapsed = {
  code: string,
  elapsed: Time
}

type MatchResult = CodeAndElapsed & { match: boolean }

const fail = s => { throw new Error(s) }
const qs = s => document.querySelector(s) || fail(`${s} not found`)

const aClicks = constant('A', click(qs('[name=a]')))
const bClicks = constant('B', click(qs('[name=b]')))
const value = qs('.value')

const isMatch = ({ code, elapsed }: CodeAndElapsed): boolean =>
  elapsed < 5000 && code === 'ABBABA'

// NOTE: buble is failing when using object spread here (i.e. `...ce`)
const verify = (isMatch: CodeAndElapsed => boolean): (CodeAndElapsed => MatchResult) =>
  (ce) => ({ code: ce.code, elapsed: ce.elapsed, match: isMatch(ce) })

const codeAndTime = (pairs: TimeAndLetter[]): CodeAndElapsed => ({
  code: pairs.map(({ value }) => value).join(''),
  elapsed: pairs[pairs.length - 1].time - pairs[0].time
})

const slidingWindow = <A> (size: number): (Stream<A> => Stream<A[]>) =>
  compose(skip(1), scan((events, event) =>
    events.concat(event).slice(-size), []))

const withTime = <A> (s: Stream<A>): Stream<TimeAndValue<A>> =>
  snapshot((time, value) => ({ time, value }), time(), s)

const render = ({ code, elapsed, match }: MatchResult): string =>
  `${code} ${(elapsed / 1000).toFixed(2)} secs ${match ? 'MATCHED' : ''}`

const results =
  compose(tap(result => { value.innerText = render(result) }),
  compose(map(verify(isMatch)),
  compose(map(codeAndTime),
  compose(slidingWindow(6),
    withTime))))

runEffects(results(merge(aClicks, bClicks)), newDefaultScheduler())
