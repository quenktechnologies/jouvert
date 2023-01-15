import { Response } from '@quenk/jhr/lib/response';
import { Tag } from '@quenk/jhr/lib/request/options';
import { ErrorBody, CompleteHandler, AbstractCompleteHandler } from '../../callback';
import { TransportErr } from '../../';
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
export type TagHandlerSpec<B> = [TagName, TagValue, CompleteHandler<B> | CompleteHandler<B>[]];
/**
 * ExpandedTagHandlerSpec where the handlers specified as an array have been
 * converted to [[CompositeHandler]]s
 */
export type ExpandedTagHandlerSpec<B> = [TagName, TagValue, CompleteHandler<B>];
/**
 * TaggedHandler allows for the selective application of handlers based on tags
 * applied to the initial request.
 *
 * It is up to the model that uses this handler to properly tag requests sent
 * out. The base remote model adds the "path", "verb" and "method" tags by
 * default.
 */
export declare class TaggedHandler<B> extends AbstractCompleteHandler<B> {
    handlers: ExpandedTagHandlerSpec<B>[];
    constructor(handlers: ExpandedTagHandlerSpec<B>[]);
    /**
     * create a TaggedHandler instance normalizing the handler part of each
     * spec.
     *
     * Using this method is preferred to the constructor.
     */
    static create<B>(specs: TagHandlerSpec<B>[]): TaggedHandler<B>;
    _getHandler(tags?: {
        [key: string]: TagValue;
    }): CompleteHandler<B>;
    onError(e: TransportErr): import("@quenk/noni/lib/control/monad/future").Yield<void>;
    onClientError(res: Response<ErrorBody>): import("@quenk/noni/lib/control/monad/future").Yield<void>;
    onServerError(res: Response<ErrorBody>): import("@quenk/noni/lib/control/monad/future").Yield<void>;
    onComplete(res: Response<B>): import("@quenk/noni/lib/control/monad/future").Yield<void>;
}
