// =======================
// Domain: Serial Event Queue
//
// Use this to ensure asynchronous SBP invocations get invoked serially,
// one after another, waiting for the previous invocation to finish completely.
// =======================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@sbp/sbp"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const sbp_1 = __importDefault(require("@sbp/sbp"));
    const isEventQueueSbpEvent = (e) => {
        return Object.prototype.hasOwnProperty.call(e, 'sbpInvocation');
    };
    exports.default = (0, sbp_1.default)('sbp/selectors/register', {
        'okTurtles.eventQueue/_init': function () {
            this.eventQueues = Object.create(null);
        },
        'okTurtles.eventQueue/isWaiting': function (name) {
            var _a;
            return !!((_a = this.eventQueues[name]) === null || _a === void 0 ? void 0 : _a.length);
        },
        'okTurtles.eventQueue/queuedInvocations': function (name) {
            var _a, _b;
            if (name == null) {
                return Object.fromEntries(Object.entries(this.eventQueues).map(([name, events]) => [name, events.map((event) => {
                        if (isEventQueueSbpEvent(event)) {
                            return event.sbpInvocation;
                        }
                        else {
                            return event.fn;
                        }
                    })]));
            }
            return (_b = (_a = this.eventQueues[name]) === null || _a === void 0 ? void 0 : _a.map((event) => {
                if (isEventQueueSbpEvent(event)) {
                    return event.sbpInvocation;
                }
                else {
                    return event.fn;
                }
            })) !== null && _b !== void 0 ? _b : [];
        },
        'okTurtles.eventQueue/queueEvent': async function (name, invocation) {
            if (!Object.prototype.hasOwnProperty.call(this.eventQueues, name)) {
                this.eventQueues[name] = [];
            }
            const events = this.eventQueues[name];
            let accept;
            const promise = new Promise((resolve) => { accept = resolve; });
            const thisEvent = typeof invocation === 'function'
                ? {
                    fn: invocation,
                    promise
                }
                : {
                    sbpInvocation: invocation,
                    promise
                };
            events.push(thisEvent);
            while (events.length > 0) {
                const event = events[0];
                if (event === thisEvent) {
                    try {
                        if (typeof invocation === 'function') {
                            return await invocation();
                        }
                        else {
                            return await (0, sbp_1.default)(...invocation);
                        }
                    }
                    finally {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        accept();
                        events.shift();
                    }
                }
                else {
                    // wait for invocation to finish
                    await event.promise;
                }
            }
        }
    });
});
