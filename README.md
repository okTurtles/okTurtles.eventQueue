# `okTurtles.eventQueue`

A serial event queue for asynchronous [SBP](https://github.com/okTurtles/sbp-js) invocations.

Use this to ensure asynchronous SBP invocations get invoked serially, one after another, waiting for the previous invocation to finish completely.

Install:

```
$ npm install --save @sbp/okturtles.eventqueue
```

Usage:

```js
import sbp from '@sbp/sbp'
import '@sbp/okturtles.eventQueue'

async function syncronousHandleEvent (event) {
  // here the SBP invocation to 'state/vuex/dispatch' will be
  // passed to an event queue designated by 'queue1'
  const result = await sbp('okTurtles.eventQueue/queueEvent', 'queue1', [
    'state/vuex/dispatch', 'handleEvent', event
  ])
  return result
}
```

Registers the following selectors:

- `'okTurtles.eventQueue/queueEvent'`
- `'okTurtles.eventQueue/isWaiting'`
- `'okTurtles.eventQueue/queuedInvocations'`

## History

See [HISTORY.md](HISTORY.md).

## License

[MIT](LICENSE.txt).
