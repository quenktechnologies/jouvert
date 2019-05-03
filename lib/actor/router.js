"use strict";
/**
 * The router module provides interfaces for building client side router actors.
 *
 * The approach here is assumed to be one where a single actor acts as a
 * router that schedules control of the application between other actors.
 *
 * At most only one actor is allowed to have control and is referred to as the
 * the current actor. When the user triggers a request for another
 * actor (the next actor), the current actor is first relieved of control
 * then the next actor promoted.
 *
 * The transfer of control is "polite" in that it is expected the router
 * will inform the current actor that it has to give up control. Interfaces
 * are provided to receive an acknowledgement (Ack) message as well as
 * listeninig for timeouts via expiration (Exp) messages when things go wrong.
 *
 * Behaviour Matrix:
 *               routing                  waiting
 * routing       <Message>                <Dispatch>
 * waiting       <Ack>|<Continue>|<Expire>
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * DispatchCase invokes the beforeAwait hook then transitions
 * to awaiting.
 *
 * Use the beforeAwait to turn off the currently scheduled actor.
 */
var DispatchCase = /** @class */ (function (_super) {
    __extends(DispatchCase, _super);
    function DispatchCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (t) {
            return listener
                .beforeWaiting(t)
                .select(listener.waiting(t));
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return DispatchCase;
}(case_1.Case));
exports.DispatchCase = DispatchCase;
/**
 * AckCase invokes the afterAck hook then transitions to
 * dispatching.
 */
var AckCase = /** @class */ (function (_super) {
    __extends(AckCase, _super);
    function AckCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (a) {
            return listener
                .afterAck(a)
                .select(listener.routing());
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return AckCase;
}(case_1.Case));
exports.AckCase = AckCase;
/**
 * ContinueCase invokes the afterContinue hook then transitions
 * to dispatching.
 */
var ContinueCase = /** @class */ (function (_super) {
    __extends(ContinueCase, _super);
    function ContinueCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (c) {
            return listener
                .afterContinue(c)
                .select(listener.routing());
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return ContinueCase;
}(case_1.Case));
exports.ContinueCase = ContinueCase;
/**
 * ExpireCase invokes the afterExpire hook then transitions to dispatching.
 */
var ExpireCase = /** @class */ (function (_super) {
    __extends(ExpireCase, _super);
    function ExpireCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (e) {
            return listener
                .afterExpire(e)
                .select(listener.routing());
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return ExpireCase;
}(case_1.Case));
exports.ExpireCase = ExpireCase;
/**
 * MessageCase invokes the afterMessage hook then transitions to
 * dispatching.
 */
var MessageCase = /** @class */ (function (_super) {
    __extends(MessageCase, _super);
    function MessageCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (m) {
            return listener
                .afterMessage(m)
                .select(listener.routing());
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return MessageCase;
}(case_1.Case));
exports.MessageCase = MessageCase;
//# sourceMappingURL=router.js.map