// =======================
// Domain: Serial Event Queue
//
// Use this to ensure asynchronous SBP invocations get invoked serially,
// one after another, waiting for the previous invocation to finish completely.
// =======================

import sbp from '@sbp/sbp'

type SbpInvocation = Parameters<typeof sbp>
type Callable = typeof Function.prototype
type EventQueueSbpEvent = {
  sbpInvocation: SbpInvocation;
  promise: Promise<unknown>;
}
type EventQueueFnEvent = {
  fn: Callable;
  promise: Promise<unknown>;
}
type EventQueueEvent = EventQueueSbpEvent | EventQueueFnEvent
type ThisType = {
  eventQueues: Record<string, EventQueueEvent[]>
}

const isEventQueueSbpEvent = (e: EventQueueEvent): e is EventQueueSbpEvent => {
  return Object.prototype.hasOwnProperty.call(e, 'sbpInvocation')
}

export default (sbp('sbp/selectors/register', {
  'okTurtles.eventQueue/_init': function (this: ThisType) {
    this.eventQueues = Object.create(null)
  },
  'okTurtles.eventQueue/isWaiting': function (this: ThisType, name: string): boolean {
    return !!this.eventQueues[name]?.length
  },
  'okTurtles.eventQueue/queuedInvocations': function (this: ThisType, name?: string | null | undefined): (SbpInvocation | Callable)[] | Record<string, (SbpInvocation | Callable)[]> {
    if (name == null) {
      return Object.fromEntries(Object.entries(this.eventQueues).map(([name, events]) => [name, events.map((event) => {
        if (isEventQueueSbpEvent(event)) {
          return event.sbpInvocation
        } else {
          return event.fn
        }
      })]))
    }
    return this.eventQueues[name]?.map((event) => {
      if (isEventQueueSbpEvent(event)) {
        return event.sbpInvocation
      } else {
        return event.fn
      }
    }) ?? []
  },
  'okTurtles.eventQueue/queueEvent': async function (this: ThisType, name: string, invocation: SbpInvocation | Callable) {
    if (!Object.prototype.hasOwnProperty.call(this.eventQueues, name)) {
      this.eventQueues[name] = []
    }

    const events = this.eventQueues[name]
    let accept: () => void
    const promise = new Promise<void>((resolve) => { accept = resolve })
    const thisEvent = typeof invocation === 'function'
      ? {
          fn: invocation,
          promise
        }
      : {
          sbpInvocation: invocation,
          promise
        }
    events.push(thisEvent)
    while (events.length > 0) {
      const event = events[0]
      if (event === thisEvent) {
        try {
          if (typeof invocation === 'function') {
            return await invocation()
          } else {
            return await sbp(...invocation)
          }
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
