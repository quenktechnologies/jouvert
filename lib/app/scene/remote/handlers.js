"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnSaveFailed = exports.AfterSearchSetPagination = exports.AfterSearchShowData = exports.AfterSearchUpdateWidget = exports.AfterSearchSetData = exports.ShiftingOnClientError = exports.ShiftingOnComplete = void 0;
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
 * AfterSearchSetData sets the "data" property of the provided object with data
 * returned from a successful search.
 *
 * This handler is intended to be used mostly when loading table data.
 */
class AfterSearchSetData extends model_1.SearchHandler {
    constructor(table) {
        super();
        this.table = table;
    }
    onComplete(res) {
        this.table.data = (res.code === 200) ? res.body.data : [];
    }
}
exports.AfterSearchSetData = AfterSearchSetData;
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
        let mtable = util_1.getById(this.view, this.id);
        if (mtable.isJust())
            mtable.get().update(res.body.data || []);
    }
}
exports.AfterSearchUpdateWidget = AfterSearchUpdateWidget;
/**
 * AfterSearchShowData displays the scene after a successful search result.
 */
class AfterSearchShowData extends model_1.SearchHandler {
    constructor(scene) {
        super();
        this.scene = scene;
    }
    onComplete(_) {
        this.scene.show();
    }
}
exports.AfterSearchShowData = AfterSearchShowData;
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
        if (res.code === 200)
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
//# sourceMappingURL=handlers.js.map