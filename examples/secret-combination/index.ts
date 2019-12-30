import { Stream, Time } from '@most/types'
import { time, snapshot } from '../../src'
import { scan, merge, skip, constant, map, tap, runEffects } from '@most/core'
import { newDefaultScheduler } from '@most/scheduler'
import { click } from '@most/dom-event'
import { compose, append } from '@most/prelude'

type TimeAndValue<A> = [Time, A]

const timeOf = <A>(tv: TimeAndValue<A>): Time => tv[0]
const valueOf = <A>(tv: TimeAndValue<A>): A => tv[1]

type TimeAndLetter = TimeAndValue<string>

type CodeAndElapsed = { code: string, elapsed: Time }

type MatchResult = CodeAndElapsed & { match: boolean }

// DOM Event helpers
const fail = (s: string): never => { throw new Error(s) }
const qs = (s: string): HTMLElement => document.querySelector(s) || fail(`${s} not found`)

const aClicks = constant('A', click(qs('[name=a]')))
const bClicks = constant('B', click(qs('[name=b]')))
const value = qs('.value')

const isMatch = ({ code, elapsed }: CodeAndElapsed): boolean =>
  elapsed < 5000 && code === 'ABBABA'

const verify = (isMatch: (ce: CodeAndElapsed) => boolean) =>
  (ce: CodeAndElapsed): MatchResult => ({ ...ce, match: isMatch(ce) })

const codeAndTime = (pairs: TimeAndLetter[]): CodeAndElapsed => ({
  code: pairs.map(valueOf).join(''),
  elapsed: timeOf(pairs[pairs.length - 1]) - timeOf(pairs[0])
})

const slidingWindow = <A>(size: number): ((s: Stream<A>) => Stream<A[]>) =>
  compose(skip(1), scan((events, event) =>
    append(event, events).slice(-size), []))

const withTime = <A>(s: Stream<A>): Stream<TimeAndValue<A>> =>
  snapshot(time, s)

const render = ({ code, elapsed, match }: MatchResult): string =>
  `${code} ${(elapsed / 1000).toFixed(2)} secs ${match ? 'MATCHED' : ''}`

const results =
  compose(tap((result: MatchResult): void => { value.innerText = render(result) }),
    compose(map(verify(isMatch)),
      compose(map(codeAndTime),
        compose(slidingWindow(6),
          withTime))))

runEffects(results(merge(aClicks, bClicks)), newDefaultScheduler())
