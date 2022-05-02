'use strict'; // =======================
// Domain: Serial Event Queue
//
// Use this to ensure asynchronous SBP invocations get invoked serially,
// one after another, waiting for the previous invocation to finish completely.
// =======================

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _sbp = _interopRequireDefault(require("@sbp/sbp"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const eventQueues = Object.create(null);

var _default = (0, _sbp.default)('sbp/selectors/register', {
  // TODO: define a proper sbpInvocation Flowtype
  'okTurtles.eventQueue/queueEvent': async function (name, sbpInvocation) {
    if (!eventQueues[name]) {
      eventQueues[name] = {
        events: []
      };
    }

    const events = eventQueues[name].events;
    let accept;
    const thisEvent = {
      sbpInvocation,
      promise: new Promise(a => {
        accept = a;
      })
    };
    events.push(thisEvent);

    while (events.length > 0) {
      const event = events[0];

      if (event === thisEvent) {
        try {
          return await (0, _sbp.default)(...event.sbpInvocation);
        } finally {
          accept();
          events.shift();
        }
      } else {
        // wait for invocation to finish
        await event.promise;
      }
    }
  }
});

exports.default = _default;
