"use strict";
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
var response_1 = require("@quenk/jhr/lib/response");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var display_1 = require("../../../actor/api/router/display");
var interact_1 = require("../../../actor/interact");
var preload_1 = require("../../../actor/interact/data/preload");
var response_2 = require("../../../actor/interact/data/preload/http/response");
var actor_1 = require("../../../actor");
/**
 * Start indicator.
 */
var Start = /** @class */ (function () {
    function Start() {
    }
    return Start;
}());
exports.Start = Start;
/**
 * FetchFinishError
 */
var FetchFinishError = /** @class */ (function () {
    function FetchFinishError(name, response) {
        this.name = name;
        this.response = response;
    }
    return FetchFinishError;
}());
exports.FetchFinishError = FetchFinishError;
/**
 * FetchFinishOk indicator.
 */
var FetchFinishOk = /** @class */ (function () {
    function FetchFinishOk(name, responses) {
        this.name = name;
        this.responses = responses;
    }
    return FetchFinishOk;
}());
exports.FetchFinishOk = FetchFinishOk;
/**
 * FetchService is used to load a batch of data at once.
 *
 * Once all requests are complete it responds with FetchFinishOk or
 * FetchFinishError if any respond with a supported error status.
 */
var FetchService = /** @class */ (function (_super) {
    __extends(FetchService, _super);
    function FetchService(name, display, requests, resource, parent, system) {
        var _this = _super.call(this, system) || this;
        _this.name = name;
        _this.display = display;
        _this.requests = requests;
        _this.resource = resource;
        _this.parent = parent;
        _this.system = system;
        _this.responses = [];
        return _this;
    }
    FetchService.prototype.enqueue = function (r) {
        this.responses.push(r);
        if (this.responses.length === this.requests.length) {
            this.tell(this.self(), new FetchFinishOk(this.name, this.responses.slice()));
            this.responses = [];
        }
        return this;
    };
    FetchService.prototype.bail = function (r) {
        this.tell(this.self(), new FetchFinishError(this.name, r));
        this.responses = [];
        return this;
    };
    /**
     * beforeLoading hook fires off the requests.
     */
    FetchService.prototype.beforeLoading = function (_) {
        var _this = this;
        this.requests.forEach(function (r) {
            r.options.tags = r.options.tags || {};
            r.options.tags.client = _this.self();
            _this.tell(_this.resource, r);
        });
        return this;
    };
    FetchService.prototype.afterNoContent = function (r) {
        return this.enqueue(r);
    };
    FetchService.prototype.afterOk = function (r) {
        return this.enqueue(r);
    };
    FetchService.prototype.afterBadRequest = function (r) {
        return this.bail(r);
    };
    FetchService.prototype.afterUnauthorized = function (r) {
        return this.bail(r);
    };
    FetchService.prototype.afterForbidden = function (r) {
        return this.bail(r);
    };
    FetchService.prototype.afterNotFound = function (r) {
        return this.bail(r);
    };
    FetchService.prototype.afterServerError = function (r) {
        return this.bail(r);
    };
    FetchService.prototype.loading = function (r) {
        return exports.whenLoading(this, r);
    };
    FetchService.prototype.beforeResumed = function (_) {
        this.tell(this.self(), new display_1.Suspend('?'));
        return this;
    };
    FetchService.prototype.resumed = function (_) {
        return exports.whenResumed(this);
    };
    FetchService.prototype.beforeSuspended = function (_) {
        return this;
    };
    FetchService.prototype.suspended = function () {
        return exports.whenSuspended(this);
    };
    FetchService.prototype.run = function () {
        this.select(this.suspended());
    };
    return FetchService;
}(actor_1.Mutable));
exports.FetchService = FetchService;
/**
 * InternalFinishOkCase
 */
var InternalFinishOkCase = /** @class */ (function (_super) {
    __extends(InternalFinishOkCase, _super);
    function InternalFinishOkCase(self) {
        var _this = _super.call(this, FetchFinishOk, function (r) {
            self
                .tell(self.parent, r)
                .select(self.suspended());
        }) || this;
        _this.self = self;
        return _this;
    }
    return InternalFinishOkCase;
}(case_1.Case));
exports.InternalFinishOkCase = InternalFinishOkCase;
/**
 * InternalFinishErrorCase
 */
var InternalFinishErrorCase = /** @class */ (function (_super) {
    __extends(InternalFinishErrorCase, _super);
    function InternalFinishErrorCase(self) {
        var _this = _super.call(this, FetchFinishError, function (r) {
            self
                .tell(self.parent, r)
                .select(self.suspended());
        }) || this;
        _this.self = self;
        return _this;
    }
    return InternalFinishErrorCase;
}(case_1.Case));
exports.InternalFinishErrorCase = InternalFinishErrorCase;
/**
 * FetchFinishOkCase
 */
var FetchFinishOkCase = /** @class */ (function (_super) {
    __extends(FetchFinishOkCase, _super);
    function FetchFinishOkCase(token, listener) {
        var _this = _super.call(this, FetchFinishOk, function (r) {
            listener
                .afterFetchFinishOk(r)
                .select(listener.resumed(token));
        }) || this;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return FetchFinishOkCase;
}(case_1.Case));
exports.FetchFinishOkCase = FetchFinishOkCase;
/**
 * FetchFinishErrorCase
 */
var FetchFinishErrorCase = /** @class */ (function (_super) {
    __extends(FetchFinishErrorCase, _super);
    function FetchFinishErrorCase(token, listener) {
        var _this = _super.call(this, FetchFinishError, function (r) {
            listener
                .afterFetchFinishError(r)
                .select(listener.resumed(token));
        }) || this;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return FetchFinishErrorCase;
}(case_1.Case));
exports.FetchFinishErrorCase = FetchFinishErrorCase;
/**
 * whenSuspended
 *           loading  suspended
 * suspended <Start>  <Suspend>
 */
exports.whenSuspended = function (c) {
    return [
        new preload_1.LoadCase(Start, c),
        new interact_1.SuspendCase(display_1.Suspend, c)
    ];
};
/**
 * whenLoading
 *         resumed           suspended
 * loading <Response>        <Suspend>
 */
exports.whenLoading = function (c, r) {
    return [
        new response_2.OkCase(response_1.Ok, r, c),
        new response_2.NoContentCase(response_1.NoContent, r, c),
        new response_2.BadRequestCase(response_1.BadRequest, r, c),
        new response_2.UnauthorizedCase(response_1.Unauthorized, r, c),
        new response_2.ForbiddenCase(response_1.Forbidden, r, c),
        new response_2.NotFoundCase(response_1.NotFound, r, c),
        new response_2.ServerErrorCase(response_1.ServerError, r, c),
        new InternalFinishOkCase(c),
        new InternalFinishErrorCase(c),
        new interact_1.SuspendCase(display_1.Suspend, c)
    ];
};
/**
 * whenResumed
 *         suspended
 * resumed <Suspend>
 */
exports.whenResumed = function (c) {
    return [
        new interact_1.SuspendCase(display_1.Suspend, c),
    ];
};
//# sourceMappingURL=fetch.js.map