// =======================
// Domain: Serial Event Queue
//
// Use this to ensure asynchronous SBP invocations get invoked serially,
// one after another, waiting for the previous invocation to finish completely.
// =======================

import type { SbpInvocation } from '@sbp/sbp'
import sbp from '@sbp/sbp'

type EventQueueEvent = {
  sbpInvocation: SbpInvocation;
  promise: Promise<unknown>;
}
type ThisType = {
  eventQueues: Record<string, { events: EventQueueEvent[] }>
}

export default (sbp('sbp/selectors/register', {
  'okTurtles.eventQueue/_init': function (this: ThisType) {
    this.eventQueues = Object.create(null)
  },
  'okTurtles.eventQueue/isWaiting': function (this: ThisType, name: string): boolean {
    return !!this.eventQueues?.[name].events.length
  },
  'okTurtles.eventQueue/queuedInvocations': function (this: ThisType, name: string): SbpInvocation[] {
    return this.eventQueues?.[name].events.map((event) => event.sbpInvocation) ?? []
  },
  'okTurtles.eventQueue/queueEvent': function (this: ThisType, name: string, sbpInvocation: SbpInvocation) {
    if (!Object.prototype.hasOwnProperty.call(this.eventQueues, name)) {
      this.eventQueues[name] = { events: [] }
    }

    const events = this.eventQueues[name].events
    const thisEvent: EventQueueEvent = {
      sbpInvocation,
      promise: Promise.resolve().then(async () => {
        while (events.length > 0) {
          const event = events[0]
          if (event === thisEvent) {
            try {
              return await sbp(...event.sbpInvocation)
            } finally {
              events.shift()
            }
          }
	  try {
            // wait for invocation to finish
            await event.promise
          } catch {
            // do nothing if it fails, since it's not this invocation
            continue
          }
        }
      })
    }

    events.push(thisEvent)

    return thisEvent.promise
  }
}) as string[])
