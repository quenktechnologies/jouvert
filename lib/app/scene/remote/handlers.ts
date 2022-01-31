/**
 * This module provides common [[CompleteHandlers]] used in Jouvert projects for
 * fetching and displaying data. Information management apps built with Jouvert 
 * tend to have many different screens that function similarly, differing mostly 
 * in the data managed. To enjoy code re-usability between these screens, we use 
 * [[RemoteModel]]s to load data and implement most of the callback work in
 * CompleteHandlers.
 *
 * As much as possible, the CompleteHandlers here try to do one thing only so
 * that they are more composable. This should allow multiple handlers to be
 * combined into one in arrangements that suit the apps needs.
 */
import { Object } from '@quenk/noni/lib/data/jsonx';

import { Response } from '@quenk/jhr/lib/response';

import { View } from '@quenk/wml';

import { Updatable } from '@quenk/wml-widgets/lib/data/updatable';

import {
    AbstractCompleteHandler,
    CompleteHandler
} from '../../remote/callback';
import { Pagination, SearchHandler, SearchResponse } from '../../remote/model';
import { getById } from '@quenk/wml-widgets/lib/util';

/**
 * ShiftingOnComplete uses the next [[CompleteHandler]] from the list provided
 * for each successful response until only one is left.
 *
 * The final remaining handler is used for any requests thereafter.
 */
export class ShiftingOnComplete<T> extends AbstractCompleteHandler<T> {

    constructor(public handlers: CompleteHandler<T>[]) { super(); }

    _handlers: CompleteHandler<T>[] = this.handlers.slice();

    onComplete(r: Response<T>) {

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
 * AfterSearchSetData sets the "data" property of the provided object with data
 * returned from a successful search.
 *
 * This handler is intended to be used mostly when loading table data.
 */
export class AfterSearchSetData<T extends Object> extends SearchHandler<T> {

    constructor(public table: { data?: T[] }) { super(); }

    onComplete(res: SearchResponse<T>) {

        this.table.data = (res.code === 200) ? res.body.data : [];

    }

}

/**
 * AfterSearchUpdateWidget calls the update() method of a WML updatable widget
 * after a successful search.
 */
export class AfterSearchUpdateWidget<T extends Object>
    extends
    SearchHandler<T> {

    constructor(public view: View, public id: string) { super(); }

    onComplete(res: SearchResponse<T>) {

        let mtable = getById<Updatable<T>>(this.view, this.id);

        if (mtable.isJust())
            mtable.get().update(res.body.data || []);

    }

}

/**
 * AfterSearchShowData displays the scene after a successful search result.
 */
export class AfterSearchShowData<T extends Object> extends SearchHandler<T> {

    constructor(public scene: { show(): void }) { super(); }

    onComplete(_: SearchResponse<T>) {

        this.scene.show();

    }

}

/**
 * AfterSearchSetPagination sets the pagination property of an object after a
 * successful search.
 */
export class AfterSearchSetPagination<T extends Object>
    extends
    SearchHandler<T> {

    constructor(public target: { pagination?: Pagination }) { super(); }

    onComplete(res: SearchResponse<T>) {

        if (res.code === 200)
            this.target.pagination = res.body.meta.pagination;

    }

}
