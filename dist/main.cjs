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

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var eventQueues = {};
var STATE_PENDING = 0;
var STATE_INVOKING = 1;
var STATE_FINISHED = 2;

var _default = (0, _sbp.default)('sbp/selectors/register', {
  // TODO: define a proper sbpInvocation Flowtype
  'okTurtles.eventQueue/queueEvent': function () {
    var _okTurtlesEventQueueQueueEvent = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(name, sbpInvocation) {
      var events, event;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!eventQueues[name]) {
                eventQueues[name] = {
                  events: []
                };
              }

              events = eventQueues[name].events;
              events.push({
                sbpInvocation: sbpInvocation,
                state: STATE_PENDING,
                promise: null
              });

            case 3:
              if (!(events.length > 0)) {
                _context.next = 21;
                break;
              }

              event = events[0];

              if (!(event.state === STATE_PENDING)) {
                _context.next = 13;
                break;
              }

              event.state = STATE_INVOKING;
              event.promise = _sbp.default.apply(void 0, _toConsumableArray(event.sbpInvocation));
              _context.next = 10;
              return event.promise;

            case 10:
              event.state = STATE_FINISHED;
              _context.next = 19;
              break;

            case 13:
              if (!(event.state === STATE_INVOKING)) {
                _context.next = 18;
                break;
              }

              _context.next = 16;
              return event.promise;

            case 16:
              _context.next = 19;
              break;

            case 18:
              // STATE_FINISHED
              events.shift();

            case 19:
              _context.next = 3;
              break;

            case 21:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    function okTurtlesEventQueueQueueEvent(_x, _x2) {
      return _okTurtlesEventQueueQueueEvent.apply(this, arguments);
    }

    return okTurtlesEventQueueQueueEvent;
  }()
});

exports.default = _default;
