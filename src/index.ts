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
    return !!this.eventQueues[name]?.events.length
  },
  'okTurtles.eventQueue/queuedInvocations': function (this: ThisType, name: string): SbpInvocation[] {
    return this.eventQueues[name]?.events.map((event) => event.sbpInvocation) ?? []
  },
  'okTurtles.eventQueue/queueEvent': async function (this: ThisType, name: string, sbpInvocation: SbpInvocation) {
    if (!Object.prototype.hasOwnProperty.call(this.eventQueues, name)) {
      this.eventQueues[name] = { events: [] }
    }

    const events = this.eventQueues[name].events
    let accept: () => void
    const thisEvent = {
      sbpInvocation,
      promise: new Promise<void>((resolve) => { accept = resolve })
    }
    events.push(thisEvent)
    while (events.length > 0) {
      const event = events[0]
      if (event === thisEvent) {
        try {
          return await sbp(...event.sbpInvocation)
        } finally {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          accept()
          events.shift()
        }
      } else {
        // wait for invocation to finish
        await event.promise
      }
    }
  }
}) as string[])
