// 

'use strict'

// =======================
// Domain: Serial Event Queue
//
// Use this to ensure asynchronous SBP invocations get invoked serially,
// one after another, waiting for the previous invocation to finish completely.
// =======================

import sbp from '@sbp/sbp'

const eventQueues = {}

export default (sbp('sbp/selectors/register', {
  // TODO: define a proper sbpInvocation Flowtype
  'okTurtles.eventQueue/queueEvent': async function (name, sbpInvocation) {
    if (!eventQueues[name]) {
      eventQueues[name] = { events: [] }
    }
    const events = eventQueues[name].events
    const thisEvent = {
      sbpInvocation,
      promise: null
    }
    events.push(thisEvent)
    while (events.length > 0) {
      const event = events[0]
      if (event === thisEvent) {
        const promise = sbp(...event.sbpInvocation)
	event.promise = new Promise((accept) => promise.finally(accept))
	try {
	  return await promise
	} finally {
	  events.shift()
	}
      } else {
        // wait for invocation to finish
        await event.promise
      }
    }
  }
}))
