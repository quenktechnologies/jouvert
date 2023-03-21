"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AfterCreated = exports.AfterDeleteOk = exports.AfterPatchOk = exports.AfterGetOk = exports.AfterOk = exports.AfterNotFound = exports.AfterConflict = exports.OnSaveFailed = exports.AfterSearchSetPagination = exports.OnCompleteShowData = exports.AfterSearchUpdateWidgets = exports.AfterSearchUpdateWidget = exports.AfterGetSetData = exports.AfterSearchSetData = exports.ShiftingOnClientError = exports.ShiftingOnComplete = void 0;
const method_1 = require("@quenk/jhr/lib/request/method");
const util_1 = require("@quenk/wml-widgets/lib/util");
const callback_1 = require("../../remote/callback");
const result_1 = require("../../remote/model/handlers/result");
const form_1 = require("../form");
/**
 * ShiftingOnComplete uses the next [[CompleteHandler]] from the list provided
 * for each successful response until only one is left.
 *
 * The final remaining handler is used for any requests thereafter.
 */
class ShiftingOnComplete extends callback_1.AbstractCompleteHandler {
    constructor(handlers) {
        super();
        this.handlers = handlers;
        this._handlers = this.handlers.slice();
    }
    onComplete(r) {
        let handler = this._handlers.length === 1 ?
            this._handlers[0] :
            this._handlers.shift();
        if (handler)
            handler.onComplete(r);
    }
}
exports.ShiftingOnComplete = ShiftingOnComplete;
/**
 * ShiftingOnClientError uses the next [[CompleteHandler]] from the list
 * provided for each response that is a client error until only one is left.
 *
 * The final remaining handler is used for any requests thereafter.
 */
class ShiftingOnClientError extends callback_1.AbstractCompleteHandler {
    constructor(handlers) {
        super();
        this.handlers = handlers;
        this._handlers = this.handlers.slice();
    }
    onClientError(r) {
        let handler = this._handlers.length === 1 ?
            this._handlers[0] :
            this._handlers.shift();
        if (handler)
            handler.onClientError(r);
    }
}
exports.ShiftingOnClientError = ShiftingOnClientError;
/**
 * AfterSearchSetData calls the supplied callback with the data property of the
 * body of a successful search request.
 *
 * This handler is intended to be used mostly when loading data for table scenes.
 */
class AfterSearchSetData extends result_1.SearchResultHandler {
    constructor(setter) {
        super();
        this.setter = setter;
    }
    onComplete(res) {
        return this.setter(((res.code === 200) &&
            res.request.method === 'GET') ? res.body.data : []);
    }
}
exports.AfterSearchSetData = AfterSearchSetData;
/**
 * AfterGetSetData calls the supplied callback with the data property of the
 * body of a successful search request.
 *
 * This handler is intended to be used mostly when loading data for table scenes.
 */
class AfterGetSetData extends result_1.GetResultHandler {
    constructor(setter) {
        super();
        this.setter = setter;
    }
    onComplete(res) {
        if ((res.code === 200) && res.request.method === 'GET')
            return this.setter(res.body);
    }
}
exports.AfterGetSetData = AfterGetSetData;
/**
 * AfterSearchUpdateWidget calls the update() method of a WML updatable widget
 * after a successful search.
 */
class AfterSearchUpdateWidget extends result_1.SearchResultHandler {
    constructor(view, id) {
        super();
        this.view = view;
        this.id = id;
    }
    onComplete(res) {
        if ((res.code === 200) && res.request.method === 'GET') {
            let mtable = (0, util_1.getById)(this.view, this.id);
            if (mtable.isJust())
                mtable.get().update(res.body.data || []);
        }
    }
}
exports.AfterSearchUpdateWidget = AfterSearchUpdateWidget;
/**
 * AfterSearchUpdateWidgets calls the update() of each element found in the
 * provided group id with the data property of a successful search request.
 */
class AfterSearchUpdateWidgets extends result_1.SearchResultHandler {
    constructor(view, id) {
        super();
        this.view = view;
        this.id = id;
    }
    onComplete(res) {
        if ((res.code === 200) && res.request.method === 'GET') {
            this.view.findGroupById(this.id).forEach(hit => hit.update(res.body.data || []));
        }
    }
}
exports.AfterSearchUpdateWidgets = AfterSearchUpdateWidgets;
/**
 * OnCompleteShowData calls the show() method of the provided scene on
 * successful completion of a request.
 */
class OnCompleteShowData extends callback_1.AbstractCompleteHandler {
    constructor(scene) {
        super();
        this.scene = scene;
    }
    onComplete(_) {
        this.scene.show();
    }
}
exports.OnCompleteShowData = OnCompleteShowData;
/**
 * AfterSearchSetPagination sets the pagination property of an object after a
 * successful search.
 */
class AfterSearchSetPagination extends result_1.SearchResultHandler {
    constructor(target) {
        super();
        this.target = target;
    }
    onComplete(res) {
        if ((res.code === 200) && res.request.method === 'GET')
            this.target.pages = res.body.pages;
    }
}
exports.AfterSearchSetPagination = AfterSearchSetPagination;
/**
 * OnSaveFailed notifies the target SaveListener of the failure of an attempt to
 * save form data.
 */
class OnSaveFailed extends callback_1.AbstractCompleteHandler {
    constructor(form) {
        super();
        this.form = form;
    }
    onClientError(res) {
        if (res.code === 409) {
            this.form.onSaveFailed(new form_1.SaveFailed(res.body.errors));
        }
    }
}
exports.OnSaveFailed = OnSaveFailed;
/**
 * AfterConflict executes the provided handler when a 409 client status is
 * encountered.
 */
class AfterConflict extends callback_1.AbstractCompleteHandler {
    constructor(handler) {
        super();
        this.handler = handler;
    }
    onClientError(res) {
        if (res.code === 409)
            return this.handler();
    }
}
exports.AfterConflict = AfterConflict;
/**
 * AfterNotFound executes the provided handler when a 404 status is encountered.
 */
class AfterNotFound extends callback_1.AbstractCompleteHandler {
    constructor(handler) {
        super();
        this.handler = handler;
    }
    onClientError(res) {
        if (res.code === 404)
            return this.handler();
    }
}
exports.AfterNotFound = AfterNotFound;
/**
 * AfterOk invokes a handler if the response has status 200.
 */
class AfterOk extends callback_1.AbstractCompleteHandler {
    constructor(handler) {
        super();
        this.handler = handler;
    }
    onComplete(res) {
        if (res.code === 200)
            return this.handler(res);
    }
}
exports.AfterOk = AfterOk;
/**
 * AfterGetOk invokes a handler if the request was a Get and the response
 * has status 200.
 */
class AfterGetOk extends AfterOk {
    onComplete(res) {
        if ((res.code === 200) && res.request.method === method_1.Method.Get)
            return this.handler(res);
    }
}
exports.AfterGetOk = AfterGetOk;
/**
 * AfterPatchOk invokes a handler if the request was a Patch and the response
 * has status 200.
 */
class AfterPatchOk extends AfterOk {
    onComplete(res) {
        if ((res.code === 200) && res.request.method === method_1.Method.Patch)
            return this.handler(res);
    }
}
exports.AfterPatchOk = AfterPatchOk;
/**
 * AfterDeleteOk invokes a handler if the request was a Delete and the response
 * has status 200.
 */
class AfterDeleteOk extends AfterOk {
    onComplete(res) {
        if ((res.code === 200) && res.request.method === method_1.Method.Delete)
            return this.handler(res);
    }
}
exports.AfterDeleteOk = AfterDeleteOk;
/**
 * AfterCreated invokes a handler if the response has status 201.
 */
class AfterCreated extends callback_1.AbstractCompleteHandler {
    constructor(handler) {
        super();
        this.handler = handler;
    }
    onComplete(res) {
        if (res.code === 201)
            return this.handler(res);
    }
}
exports.AfterCreated = AfterCreated;
//# sourceMappingURL=handlers.js.map