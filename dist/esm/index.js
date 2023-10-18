// =======================
// Domain: Serial Event Queue
//
// Use this to ensure asynchronous SBP invocations get invoked serially,
// one after another, waiting for the previous invocation to finish completely.
// =======================
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sbp from '@sbp/sbp';
export default sbp('sbp/selectors/register', {
    'okTurtles.eventQueue/_init': function () {
        this.eventQueues = Object.create(null);
    },
    'okTurtles.eventQueue/isWaiting': function (name) {
        var _a;
        return !!((_a = this.eventQueues[name]) === null || _a === void 0 ? void 0 : _a.events.length);
    },
    'okTurtles.eventQueue/queuedInvocations': function (name) {
        var _a, _b;
        return (_b = (_a = this.eventQueues[name]) === null || _a === void 0 ? void 0 : _a.events.map((event) => event.sbpInvocation)) !== null && _b !== void 0 ? _b : [];
    },
    'okTurtles.eventQueue/queueEvent': function (name, sbpInvocation) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Object.prototype.hasOwnProperty.call(this.eventQueues, name)) {
                this.eventQueues[name] = { events: [] };
            }
            const events = this.eventQueues[name].events;
            let accept;
            const thisEvent = {
                sbpInvocation,
                promise: new Promise((resolve) => { accept = resolve; })
            };
            events.push(thisEvent);
            while (events.length > 0) {
                const event = events[0];
                if (event === thisEvent) {
                    try {
                        return yield sbp(...event.sbpInvocation);
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
                    yield event.promise;
                }
            }
        });
    }
});
