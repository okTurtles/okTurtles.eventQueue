# `okTurtles.eventQueue`

A serial event queue for [SBP](https://github.com/okTurtles/sbp-js) invocations.

Use this to ensure asynchronous SBP invocations get invoked serially, one after another, waiting for the previous invocation to finish completely.

Install:

```
$ npm install --save @sbp/okturtles.eventqueue
```

Usage:

```js
import sbp from '@sbp/sbp'
import '@sbp/okturtles.eventQueue'

// a modified example from Group Income
function syncronousHandleEvent (event) {
  // make sure handleEvent is called AFTER any currently-running invocations
  // to syncContractWithServer(), to prevent gi.db from throwing
  // "bad previousHEAD" errors
  return sbp('okTurtles.eventQueue/queueEvent', event.contractID(), [
    'state/vuex/dispatch', 'handleEvent', event
  ])
}
```

Registers the following selectors:

- `'okTurtles.eventQueue/queueEvent'`

## History

See [HISTORY.md](HISTORY.md).

## License

AGPL-3.0.

See [LICENSE.txt](LICENSE.txt).
