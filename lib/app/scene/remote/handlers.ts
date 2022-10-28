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
    Pagination,
    SearchResponse
} from '../../remote/model/response';
import {
    GetResultHandler,
    SearchResultHandler,
} from '../../remote/model/handlers/result';

import { FormErrors, SaveFailed, SaveListener } from '../form';

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

    onComplete(r: Response<T>) : Yield<void> {

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
 * AfterSearchSetData calls the supplied callback with the data property of the
 * body of a successful search request.
 *
 * This handler is intended to be used mostly when loading data for table scenes.
 */
export class AfterSearchSetData<T extends Object>
    extends
    SearchResultHandler<T> {

    constructor(public setter: (data: T[]) => Yield<void>) { super(); }

    onComplete(res: SearchResponse<T>) {

        return this.setter(((res.code === 200) &&
            res.request.method === 'GET') ? res.body.data : []);

    }

}

/**
 * AfterGetSetData calls the supplied callback with the data property of the
 * body of a successful search request.
 *
 * This handler is intended to be used mostly when loading data for table scenes.
 */
export class AfterGetSetData<T extends Object> extends GetResultHandler<T> {

    constructor(public setter: (data: T) => void) { super(); }

    onComplete(res: GetResponse<T>) {

        if ((res.code === 200) && res.request.method === 'GET')
            return this.setter(res.body.data);

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

    constructor(public target: { pagination?: Pagination }) { super(); }

    onComplete(res: SearchResponse<T>) {

        if ((res.code === 200) && res.request.method === 'GET')
            this.target.pagination = res.body.meta.pagination;

    }

}

/**
 * OnSaveFailed notifies the target SaveListener of the failure of an attempt to
 * save form data.
 */
export class OnSaveFailed<T> extends AbstractCompleteHandler<T> {

    constructor(public form: SaveListener) { super(); }

    onClientError(res: Response<ClientErrorBody>) {

        if (res.code === 409) {

            this.form.onSaveFailed(new SaveFailed(res.body.errors));

        }

    }

}

/**
 * OnNotFound executes the provided handler when a 404 error is encountered.
 */
export class OnNotFound<T> extends AbstractCompleteHandler<T> {

    constructor(public handler: () => void) { super(); }

    onClientError<B>(res: Response<B>) {

        if (res.code === 404) {

            this.handler();

        }

    }

}
