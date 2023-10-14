import sbp from '@sbp/sbp'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import '../dist/esm/index.js'

/**
 * @param [ms] {number}
 */
const resolveAfterMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * @param [ms] {number}
 */
const rejectAfterMs = (ms) => new Promise((resolve, reject) => setTimeout(reject, ms))

sbp('sbp/selectors/register', {
  'okTurtles.eventQueue.test/_init' () {
    this.events = []
  },
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
  'okTurtles.eventQueue.test/getEvents' () {
    return this.events
  }
})

describe('[SBP] okTurtles.eventQueue domain', () => {
  it('should execute selectors in a queue', async () => {
    const result = await sbp(
      'okTurtles.eventQueue/queueEvent',
      'testQueue',
      ['sbp/selectors/fn', 'sbp/selectors/fn']
    )

    assert.equal(typeof result, 'function')
  })

  it('isWaiting returns the correct result', async () => {
    const invocation = ['okTurtles.eventQueue/isWaiting', 'testQueue']

    assert.equal(sbp(...invocation), false)

    const result = await sbp(
      'okTurtles.eventQueue/queueEvent',
      'testQueue',
      invocation
    )

    assert.equal(result, true)

    assert.equal(sbp(...invocation), false)
  })

  it('queuedInvocations returns the correct result', async () => {
    const invocation = ['okTurtles.eventQueue/queuedInvocations', 'testQueue']

    assert.deepEqual(sbp(...invocation), [])

    const result = await sbp(
      'okTurtles.eventQueue/queueEvent',
      'testQueue',
      ['okTurtles.eventQueue/queuedInvocations', 'testQueue']
    )

    assert.deepEqual(result, [invocation])

    assert.deepEqual(sbp(...invocation), [])
  })

  it('correctly queues multiple events', async () => {
    const promiseSettlementSequence = []

    const buildEvent = (name, resolve, ms) => {
      const promise = resolve ? resolveAfterMs(ms) : rejectAfterMs(ms)

      promise.then(() => {
        promiseSettlementSequence.push([true, name])
      }).catch(() => {
        promiseSettlementSequence.push([false, name])
      })

      return sbp(
        'okTurtles.eventQueue/queueEvent',
        'testQueue',
        ['okTurtles.eventQueue.test/push', promise, name]
      )
    }

    const results = await Promise.allSettled([
      buildEvent('event1', true, 120),
      buildEvent('event2', false, 60),
      buildEvent('event3', true, 80),
      buildEvent('event4', false, 40),
      buildEvent('event5', true, 20)
    ])

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
})
