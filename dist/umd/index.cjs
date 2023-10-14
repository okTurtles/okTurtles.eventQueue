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
    exports.default = (0, sbp_1.default)('sbp/selectors/register', {
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
            if (!Object.prototype.hasOwnProperty.call(this.eventQueues, name)) {
                this.eventQueues[name] = { events: [] };
            }
            const events = this.eventQueues[name].events;
            const thisEvent = {
                sbpInvocation,
                promise: Promise.resolve().then(() => __awaiter(this, void 0, void 0, function* () {
                    while (events.length > 0) {
                        const event = events[0];
                        if (event === thisEvent) {
                            try {
                                return yield (0, sbp_1.default)(...event.sbpInvocation);
                            }
                            finally {
                                events.shift();
                            }
                        }
                        try {
                            // wait for invocation to finish
                            yield event.promise;
                        }
                        catch (_a) {
                            // do nothing if it fails, since it's not this invocation
                            continue;
                        }
                    }
                }))
            };
            events.push(thisEvent);
            return thisEvent.promise;
        }
    });
});
