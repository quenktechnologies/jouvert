"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnNotFound = exports.OnSaveFailed = exports.AfterSearchSetPagination = exports.OnCompleteShowData = exports.AfterSearchUpdateWidget = exports.AfterGetSetData = exports.AfterSearchSetData = exports.ShiftingOnClientError = exports.ShiftingOnComplete = void 0;
const callback_1 = require("../../remote/callback");
const model_1 = require("../../remote/model");
const util_1 = require("@quenk/wml-widgets/lib/util");
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
class AfterSearchSetData extends model_1.SearchHandler {
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
class AfterGetSetData extends model_1.GetHandler {
    constructor(setter) {
        super();
        this.setter = setter;
    }
    onComplete(res) {
        if ((res.code === 200) && res.request.method === 'GET')
            return this.setter(res.body.data);
    }
}
exports.AfterGetSetData = AfterGetSetData;
/**
 * AfterSearchUpdateWidget calls the update() method of a WML updatable widget
 * after a successful search.
 */
class AfterSearchUpdateWidget extends model_1.SearchHandler {
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
class AfterSearchSetPagination extends model_1.SearchHandler {
    constructor(target) {
        super();
        this.target = target;
    }
    onComplete(res) {
        if ((res.code === 200) && res.request.method === 'GET')
            this.target.pagination = res.body.meta.pagination;
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
 * OnNotFound executes the provided handler when a 404 error is encountered.
 */
class OnNotFound extends callback_1.AbstractCompleteHandler {
    constructor(handler) {
        super();
        this.handler = handler;
    }
    onClientError(res) {
        if (res.code === 404) {
            this.handler();
        }
    }
}
exports.OnNotFound = OnNotFound;
//# sourceMappingURL=handlers.js.map