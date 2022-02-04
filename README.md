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

function syncronousHandleEvent (event) {
  // here the SBP invocation to 'state/vuex/dispatch' will be
  // passed to an event queue designed by 'eventQueue-A'
  return sbp('okTurtles.eventQueue/queueEvent', 'eventQueue-A', [
    'state/vuex/dispatch', 'handleEvent', event
  ])
}
```

Registers the following selectors:

- `'okTurtles.eventQueue/queueEvent'`

## History

See [HISTORY.md](HISTORY.md).

## License

[MIT](LICENSE.txt).
