import sbp from '@sbp/sbp'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import '../dist/esm/index.js'

const { mock } = await import('node:test')
const timers = mock?.timers

/**
 * Returns a promise that resolves after the given milliseconds have elapsed
 *
 * @param {number=} ms
 */
const resolveAfterMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Returns a promise that rejects after the given milliseconds have elapsed
 *
 * @param {number=} ms
 */
const rejectAfterMs = (ms) => new Promise((resolve, reject) => setTimeout(reject, ms))

sbp('sbp/selectors/register', {
  'okTurtles.eventQueue.test/_init' () {
    this.events = []
  },
  /**
   * Test selector to push  the result of a promise into this.events
   *
   * @template T
   * @this {{events: [boolean, unknown][]}}
   * @param {Promise<void>} promise
   * @param {T} name
   * @returns {Promise<T>}
   */
  'okTurtles.eventQueue.test/push' (promise, name) {
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
   *
   * @this {{events: [boolean, unknown][]}} */
  'okTurtles.eventQueue.test/getEvents' () {
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
    const invocation = ['okTurtles.eventQueue/isWaiting', queueName]

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
    const invocation = ['okTurtles.eventQueue/queuedInvocations', queueName]

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
    const promiseSettlementSequence = []

    /**
     * Helper function to build and enqueue events
     *
     * @template T
     * @param {string} name - Event name
     * @param {boolean} succeed - Whether the events succeeds (true) or fails
     * @param {number=} ms - Time in milliseconds that the event takes to settle
     * @returns {Promise<T>}
     */
    const buildEvent = (name, succeed, ms) => {
      const promise = succeed ? resolveAfterMs(ms) : rejectAfterMs(ms)

      let actual
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
      timers.enable(['setTimeout'])
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
