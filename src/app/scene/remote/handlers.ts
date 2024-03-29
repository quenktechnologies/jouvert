/**
 * This module provides common [[CompleteHandlers]] used in Jouvert projects for
 * fetching and displaying data. Information management apps built with Jouvert 
 * tend to have many different screens (scenes) that function similarly,
 * differing mostly in the data type managed. To enjoy code re-usability between 
 * these screens, we use [[RemoteModel]]s to load data and implement most of the 
 * callback work in CompleteHandlers.
 *
 * As much as possible, the CompleteHandlers here try to do one thing only so
 * that they are composable. This should allow multiple handlers to be
 * combined into one in arrangements that suit app needs.
 */
import { Object } from '@quenk/noni/lib/data/jsonx';

import { Response } from '@quenk/jhr/lib/response';
import { Method } from '@quenk/jhr/lib/request/method';

import { View } from '@quenk/wml';

import { Updatable } from '@quenk/wml-widgets/lib/data/updatable';
import { Yield } from '@quenk/noni/lib/control/monad/future';
import { getById } from '@quenk/wml-widgets/lib/util';

import {
    AbstractCompleteHandler,
    CompleteHandler
} from '../../remote/callback';
import {
    GetResponse,
    PageData,
    SearchResponse
} from '../../model/http';
import {
    GetResultHandler,
    SearchResultHandler,
} from '../../remote/model/handlers/result';

import { FormErrors } from '../form';

/**
 * ClientErrorBody is the expected shape of the response body when the server
 * sends a 409 status in response to a write.
 */
export interface ClientErrorBody extends Object {

    /**
     * errors map containing the names and associated messages for all invalid
     * fields.
     */
    errors: FormErrors

}

/**
 * ShiftingOnComplete uses the next [[CompleteHandler]] from the list provided
 * for each successful response until only one is left.
 *
 * The final remaining handler is used for any requests thereafter.
 */
export class ShiftingOnComplete<T> extends AbstractCompleteHandler<T> {

    constructor(public handlers: CompleteHandler<T>[]) { super(); }

    _handlers: CompleteHandler<T>[] = this.handlers.slice();

    onComplete(r: Response<T>): Yield<void> {

        let handler = this._handlers.length === 1 ?
            this._handlers[0] :
            this._handlers.shift();

        if (handler) handler.onComplete(r);

    }

}

/**
 * ShiftingOnClientError uses the next [[CompleteHandler]] from the list 
 * provided for each response that is a client error until only one is left.
 *
 * The final remaining handler is used for any requests thereafter.
 */
export class ShiftingOnClientError<T> extends AbstractCompleteHandler<T> {

    constructor(public handlers: CompleteHandler<T>[]) { super(); }

    _handlers: CompleteHandler<T>[] = this.handlers.slice();

    onClientError(r: Response<Object>) {

        let handler = this._handlers.length === 1 ?
            this._handlers[0] :
            this._handlers.shift();

        if (handler) handler.onClientError(r);

    }

}

/**
 * AfterSearch invokes a handler after a successful search.
 */
export class AfterSearch<T extends Object>
    extends
    SearchResultHandler<T> {

    constructor(public handler: (res: SearchResponse<T>) => Yield<void>) { super(); }

    onComplete(res: SearchResponse<T>) {

        return this.handler(res);

    }

}

/**
 * AfterSearchSetData calls the supplied callback with the data property of the
 * body of a successful search request.
 *
 * This handler is intended to be used mostly when loading data for table scenes.
 */
export class AfterSearchSetData<T extends Object>
    extends
    AfterSearch<T> {

    constructor(public setter: (data: T[]) => Yield<void>) {

        super(res => this.setter(((res.code === 200) &&
            res.request.method === 'GET') ? res.body.data : []));

    }

}

/**
 * AfterGet invokes a handler after a succesful Get
 */
export class AfterGet<T extends Object> extends GetResultHandler<T> {

    constructor(public handler: (res: GetResponse<T>) => void) { super(); }

    onComplete(res: GetResponse<T>) {

        if ((res.code === 200) && res.request.method === 'GET')
            return this.handler(res);

    }

}

/**
 * AfterGetSetData calls the supplied callback with the data property of the
 * body of a successful search request.
 *
 * This handler is intended to be used mostly when loading data for table scenes.
 */
export class AfterGetSetData<T extends Object> extends AfterGet<T> {

    constructor(public setter: (data: T) => void) {

        super(res => {

            if ((res.code === 200) && res.request.method === 'GET')
                return this.setter(res.body);

        });

    }

}

/**
 * AfterSearchUpdateWidget calls the update() method of a WML updatable widget
 * after a successful search.
 */
export class AfterSearchUpdateWidget<T extends Object>
    extends
    SearchResultHandler<T> {

    constructor(public view: View, public id: string) { super(); }

    onComplete(res: SearchResponse<T>) {

        if ((res.code === 200) && res.request.method === 'GET') {

            let mtable = getById<Updatable<T>>(this.view, this.id);

            if (mtable.isJust())
                mtable.get().update(res.body.data || []);

        }

    }

}

/**
 * AfterSearchUpdateWidgets calls the update() of each element found in the
 * provided group id with the data property of a successful search request.
 */
export class AfterSearchUpdateWidgets<T extends Object>
    extends
    SearchResultHandler<T> {

    constructor(public view: View, public id: string) { super(); }

    onComplete(res: SearchResponse<T>) {

        if ((res.code === 200) && res.request.method === 'GET') {

            this.view.findGroupById<Updatable<T>>(this.id).forEach(hit =>
                hit.update(res.body.data || []));

        }

    }

}

/**
 * OnCompleteShowData calls the show() method of the provided scene on 
 * successful completion of a request.
 */
export class OnCompleteShowData<T>
    extends
    AbstractCompleteHandler<T> {

    constructor(public scene: { show(): void }) { super(); }

    onComplete(_: Response<T>) {

        this.scene.show();

    }

}

/**
 * AfterSearchSetPagination sets the pagination property of an object after a
 * successful search.
 */
export class AfterSearchSetPagination<T extends Object>
    extends
    SearchResultHandler<T> {

    constructor(public target: { pages?: PageData }) { super(); }

    onComplete(res: SearchResponse<T>) {

        if ((res.code === 200) && res.request.method === 'GET')
            this.target.pages = res.body.pages;

    }

}

/** 
 * OnClientError is invoked when a client error occurs.
 */
export class OnClientError<B> extends AbstractCompleteHandler<B> {

    constructor(public handler: (res: Response<object>) => void) { super(); }

    onClientError(res: Response<object>) {

        this.handler(res);

    }

}

/**
 * OnSaveFailed invokes the target callback with the error part of the response
 */
export class OnSaveFailed<B> extends OnClientError<B> {

    constructor(public callback: (errors: FormErrors) => void) {

        super((res: Response<object>) => {

            if (res.code === 409)
                return this.callback((<ClientErrorBody>res.body).errors);

        });

    }

}

/**
 * AfterConflict executes the provided handler when a 409 client status is
 * encountered.
 */
export class AfterConflict<T> extends AbstractCompleteHandler<T> {

    constructor(public handler: () => Yield<void>) { super(); }

    onClientError<B>(res: Response<B>) {

        if (res.code === 409) return this.handler();

    }

}

/**
 * AfterNotFound executes the provided handler when a 404 status is encountered.
 */
export class AfterNotFound<T> extends AbstractCompleteHandler<T> {

    constructor(public handler: () => Yield<void>) { super(); }

    onClientError<B>(res: Response<B>) {

        if (res.code === 404) return this.handler();

    }

}

/**
 * AfterOk invokes a handler if the response has status 200.
 */
export class AfterOk<T> extends AbstractCompleteHandler<T> {

    constructor(public handler: (res: Response<T>) => Yield<void>) { super(); }

    onComplete(res: Response<T>) {

        if (res.code === 200) return this.handler(res);

    }

}

/**
 * AfterGetOk invokes a handler if the request was a Get and the response 
 * has status 200.
 */
export class AfterGetOk<T> extends AfterOk<T> {

    onComplete(res: Response<T>) {

        if ((res.code === 200) && res.request.method === Method.Get)
            return this.handler(res);

    }

}

/**
 * AfterPatchOk invokes a handler if the request was a Patch and the response
 * has status 200.
 */
export class AfterPatchOk<T> extends AfterOk<T> {

    onComplete(res: Response<T>) {

        if ((res.code === 200) && res.request.method === Method.Patch)
            return this.handler(res);

    }

}

/**
 * AfterDeleteOk invokes a handler if the request was a Delete and the response
 * has status 200.
 */
export class AfterDeleteOk<T> extends AfterOk<T> {

    onComplete(res: Response<T>) {

        if ((res.code === 200) && res.request.method === Method.Delete)
            return this.handler(res);

    }

}

/**
 * AfterCreated invokes a handler if the response has status 201.
 */
export class AfterCreated<T> extends AbstractCompleteHandler<T> {

    constructor(public handler: (res: Response<T>) => Yield<void>) { super(); }

    onComplete(res: Response<T>) {

        if (res.code === 201) return this.handler(res);

    }

}
