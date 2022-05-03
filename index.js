// @flow

'use strict'

// =======================
// Domain: Serial Event Queue
//
// Use this to ensure asynchronous SBP invocations get invoked serially,
// one after another, waiting for the previous invocation to finish completely.
// =======================

import sbp from '@sbp/sbp'

const eventQueues = Object.create(null)

export default (sbp('sbp/selectors/register', {
  // TODO: define a proper sbpInvocation Flowtype
  'okTurtles.eventQueue/queueEvent': async function (name: string, sbpInvocation: any[]) {
    if (!eventQueues[name]) {
      eventQueues[name] = { events: [] }
    }
    const events = eventQueues[name].events
    let accept
    const thisEvent = {
      sbpInvocation,
      promise: new Promise((resolve) => { accept = resolve })
    }
    events.push(thisEvent)
    while (events.length > 0) {
      const event = events[0]
      if (event === thisEvent) {
        try {
          return await sbp(...event.sbpInvocation)
        } finally {
          // $FlowFixMe
          accept()
          events.shift()
        }
      } else {
        // wait for invocation to finish
        await event.promise
      }
    }
  }
}): string[])
