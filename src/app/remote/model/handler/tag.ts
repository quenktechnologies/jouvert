import { empty } from '@quenk/noni/lib/data/record';
import { find } from '@quenk/noni/lib/data/array';
import { Type } from '@quenk/noni/lib/data/type';


import { Response } from '@quenk/jhr/lib/response';
import { Tag } from '@quenk/jhr/lib/request/options';

import {
    ErrorBody,
    CompleteHandler,
    AbstractCompleteHandler,
    CompositeCompleteHandler
} from '../../callback';
import { TransportErr } from '../../';
import { VoidHandler } from './void';

/**
 * TagName is the name of a tag as it appears in the request.options.tags object.
 */
export type TagName = string;

/**
 * TagValue TODO: Rename in upstream.
 */
export type TagValue = Tag;

/**
 * TagHandlerSpec indicates what [[CompleteHandler]] to use when specific tags
 * are encountered.
 */
export type TagHandlerSpec<B>
    = [TagName, TagValue, CompleteHandler<B> | CompleteHandler<B>[]]
    ;

/**
 * ExpandedTagHandlerSpec where the handlers specified as an array have been
 * converted to [[CompositeHandler]]s
 */
export type ExpandedTagHandlerSpec<B>
    = [TagName, TagValue, CompleteHandler<B>]
    ;

const voidHandler = new VoidHandler<Type>();

const transportErrTag = { '$error': 'TransportErr' };

/**
 * TaggedHandler allows for the selective application of handlers based on tags
 * applied to the initial request.
 *
 * It is up to the model that uses this handler to properly tag requests sent
 * out. The base remote model adds the "path", "verb" and "method" tags by 
 * default.
 */
export class TaggedHandler<B>
    extends
    AbstractCompleteHandler<B> {

    constructor(public handlers: ExpandedTagHandlerSpec<B>[]) { super(); }

    /**
     * create a TaggedHandler instance normalizing the handler part of each
     * spec.
     *
     * Using this method is preferred to the constructor.
     */
    static create<B>(specs: TagHandlerSpec<B>[]) {

        return new TaggedHandler(specs.map(([name, value, handler]) => [
            name,
            value,
            Array.isArray(handler) ?
                new CompositeCompleteHandler(handler) :
                handler
        ]));

    }

    _getHandler(tags: { [key: string]: TagValue } = {}): CompleteHandler<B> {

        if (!empty(tags)) {

            let mspec = find(this.handlers, ([name, value]) =>
                (tags[name] === value));

            if (mspec.isJust()) return mspec.get()[2]; //handler

        }

        return voidHandler;

    }

    onError(e: TransportErr) {

        return this._getHandler(transportErrTag).onError(e);

    }

    onClientError(res: Response<ErrorBody>) {

        return this._getHandler(res.request.options.tags).onClientError(res);

    }

    onServerError(res: Response<ErrorBody>) {

        return this._getHandler(res.request.options.tags).onServerError(res);

    }

    onComplete(res: Response<B>) {

        return this._getHandler(res.request.options.tags).onComplete(res);

    }

}
