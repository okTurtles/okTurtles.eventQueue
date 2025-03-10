import sbp from '@sbp/sbp'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import './index.js'

const { mock } = await import('node:test')
const timers = mock?.timers

/**
 * Returns a promise that resolves after the given milliseconds have elapsed
 *
 * @param ms
 */
const resolveAfterMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Returns a promise that rejects after the given milliseconds have elapsed
 *
 * @param ms
 */
const rejectAfterMs = (ms: number) => new Promise((resolve, reject) => setTimeout(reject, ms))

sbp('sbp/selectors/register', {
  'okTurtles.eventQueue.test/_init' (this: {events: [boolean, unknown][]}) {
    this.events = []
  },
  /**
   * Test selector to push  the result of a promise into this.events
   */
  'okTurtles.eventQueue.test/push' <T> (this: {events: [boolean, unknown][]}, promise: Promise<void>, name: T): Promise<T> {
    return promise.then((v) => {
      this.events.push([true, name])
      if (v === undefined) return name
      return v
    }).catch((e) => {
      this.events.push([false, name])
      if (e === undefined) throw name
      throw e
    })
  },
  /**
   * Test selector that returns this.events
   */
  'okTurtles.eventQueue.test/getEvents' (this: {events: [boolean, unknown][]}) {
    return this.events
  }
})

describe('[SBP] okTurtles.eventQueue domain', () => {
  it('should execute selectors in a queue', async () => {
    const queueName = 'testQueue-1'

    const result = await sbp(
      'okTurtles.eventQueue/queueEvent',
      queueName,
      ['sbp/selectors/fn', 'sbp/selectors/fn']
    )

    assert.equal(typeof result, 'function')
  })

  it('isWaiting returns the correct result', async () => {
    const queueName = 'testQueue-2'
    const invocation = ['okTurtles.eventQueue/isWaiting', queueName] as [string, ...string[]]

    assert.equal(sbp(...invocation), false)

    const result = await sbp(
      'okTurtles.eventQueue/queueEvent',
      queueName,
      invocation
    )

    assert.equal(result, true)

    assert.equal(sbp(...invocation), false)
  })

  it('queuedInvocations returns the correct result', async () => {
    const queueName = 'testQueue-3'
    const invocation = ['okTurtles.eventQueue/queuedInvocations', queueName] as[string, ...string[]]

    assert.deepEqual(sbp(...invocation), [])

    const result = await sbp(
      'okTurtles.eventQueue/queueEvent',
      queueName,
      invocation
    )

    assert.deepEqual(result, [invocation])

    assert.deepEqual(sbp(...invocation), [])
  })

  it('correctly queues multiple events', async () => {
    const queueName = 'testQueue-4'
    const promiseSettlementSequence: [boolean | undefined, string][] = []

    /**
     * Helper function to build and enqueue events
     */
    const buildEvent = <T> (name: string, succeed: boolean, ms: number): Promise<T> => {
      const promise = succeed ? resolveAfterMs(ms) : rejectAfterMs(ms)

      let actual: undefined | boolean
      // This ensures that all promises follow the exact same steps regardless
      // of result, so that the sequence in promiseSettlementSequence is
      // deterministic.
      promise.catch(() => {
        if (actual === undefined) actual = false
      }).then(() => {
        if (actual === undefined) actual = true
      }).finally(() => {
        promiseSettlementSequence.push([actual, name])
      })

      return sbp(
        'okTurtles.eventQueue/queueEvent',
        queueName,
        ['okTurtles.eventQueue.test/push', promise, name]
      )
    }

    if (timers && !process.env.TEST_NO_MOCK_TIMERS) {
      timers.enable({ apis: ['setTimeout'] })
    }

    const events = [
      buildEvent('event1', true, 1200),
      buildEvent('event2', false, 600),
      buildEvent('event3', true, 800),
      buildEvent('event4', false, 400),
      buildEvent('event5', true, 200)
    ]

    if (timers && !process.env.TEST_NO_MOCK_TIMERS) {
      timers.tick(1200)
      timers.reset()
    }

    const results = await Promise.allSettled(events)

    assert.deepEqual(promiseSettlementSequence, [
      [true, 'event5'],
      [false, 'event4'],
      [false, 'event2'],
      [true, 'event3'],
      [true, 'event1']
    ])

    const eventSequence = sbp('okTurtles.eventQueue.test/getEvents')

    assert.deepEqual(eventSequence, [
      [true, 'event1'],
      [false, 'event2'],
      [true, 'event3'],
      [false, 'event4'],
      [true, 'event5']
    ])

    assert.deepEqual(results, [
      { status: 'fulfilled', value: 'event1' },
      { status: 'rejected', reason: 'event2' },
      { status: 'fulfilled', value: 'event3' },
      { status: 'rejected', reason: 'event4' },
      { status: 'fulfilled', value: 'event5' }
    ])
  })

  it('should execute function selectors in a queue', async () => {
    const queueName = 'testQueue-5'
    let called = false

    const result = await sbp(
      'okTurtles.eventQueue/queueEvent',
      queueName,
      () => {
        called = true
      }
    )

    assert.equal(typeof result, 'undefined')
    assert.ok(called)
  })
})
