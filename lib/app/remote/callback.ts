/**
 * This module provides actors for sending requests to a [[Remote]] and
 * executing some action depending on the result. Callbacks should be spawned
 * each time a parent actor wants to make a request, once a response is
 * received, they exit. The response from the request can be handled
 * by specifying a handler object to the callback's constructor.
 */

/** imports */
import { Any } from '@quenk/noni/lib/data/type';

import { Request } from '@quenk/jhr/lib/request';
import { Response } from '@quenk/jhr/lib/response';

import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Callback } from '@quenk/potoo/lib/actor/resident/immutable/callback';
import { Address } from '@quenk/potoo/lib/actor/address';
import { System } from '@quenk/potoo/lib/actor/system';

import {
    Send,
    ParSend,
    SeqSend,
    BatchResponse,
    TransportErr
} from './';
import { sequential, wrap, Yield } from '@quenk/noni/lib/control/monad/future';
import { noop } from '@quenk/noni/lib/data/function';

export { Send, ParSend, SeqSend }

const typeMatch = { code: Number, request: Object, body: Any, headers: Object };

/**
 * SendCallbackMessage type.
 */
export type SendCallbackMessage<B>
    = Response<B>
    | TransportErr
    ;

/**
 * BatchCallbackMessage type.
 */
export type BatchCallbackMessage<B>
    = BatchResponse<B>
    | TransportErr
    ;

/**
 * ErrorBody provides details about why a request failed.
 */
export interface ErrorBody {

    /**
     * error details.
     */
    errors?: Object,

}

/**
 * FailHandler is a handler that deals with the failure of requests.
 *
 * The other handler interfaces inherit from this.
 */
export interface FailHandler {

    /**
     * onError is invoked if a TransportErr occurs.
     */
    onError(e: TransportErr): Yield<void>

    /**
     * onClientError is invoked if the response status indicates a client
     * error.
     */
    onClientError(r: Response<ErrorBody>): Yield<void>

    /**
     * onServerError is invoked if the response status indicates a server
     * error.
     */
    onServerError(r: Response<ErrorBody>): Yield<void>

}

/**
 * CompleteHandler provides a method for handling successful non-batch requests.
 */
export interface CompleteHandler<B> extends FailHandler {

    /**
     * onComplete handler.
     */
    onComplete(r: Response<B>): Yield<void>

}

/**
 * BatchComplete provides a method for handling successful batch request.
 */
export interface BatchCompleteHandler<B> extends FailHandler {

    /**
     * onBatchComplete handler.
     */
    onBatchComplete(r: BatchResponse<B>): Yield<void>

}

/**
 * AbstractCompleteHandler can be extended to partially implement a
 * [[CompleteHandler]].
 */
export class AbstractCompleteHandler<B>
    implements
    CompleteHandler<B> {

    onError(_: TransportErr) { }

    onClientError(_: Response<ErrorBody>) { }

    onServerError(_: Response<ErrorBody>) { }

    onComplete(_: Response<B>) { }

}

/**
 * AbstractBatchCompleteHandler can be extended to partially implement a
 * [[BatchCompleteHandler]].
 */
export class AbstractBatchCompleteHandler<B>
    extends AbstractCompleteHandler<B>
    implements BatchCompleteHandler<B> {

    onBatchComplete(_: BatchResponse<B>) { }

}

/**
 * CompositeCompleteHandler allows multiple [[CompleteHandler]]s to be used as
 * one.
 */
export class CompositeCompleteHandler<B>
    implements
    CompleteHandler<B> {

    constructor(public handlers: CompleteHandler<B>[]) { }

    onError(e: TransportErr) {

        return sequential(this.handlers.map(h => wrap(h.onError(e)))).map(noop);

    }

    onClientError(r: Response<ErrorBody>) {

        return sequential(this.handlers.map(h => wrap(h.onClientError(r))))
            .map(noop);

    }

    onServerError(r: Response<ErrorBody>) {

        return sequential(this.handlers.map(h => wrap(h.onServerError(r)))).
            map(noop);

    }

    onComplete(r: Response<B>) {

        return sequential(this.handlers.map(h => wrap(h.onComplete(r))))
            .map(noop);

    }

}

/**
 * CompositeBatchCompleteHandler allows multiple [[BatchCompleteHandler]]s to
 * be used as one.
 */
export class CompositeBatchCompleteHandler<B>
    implements
    BatchCompleteHandler<B> {

    constructor(public handlers: BatchCompleteHandler<B>[]) { }

    onError(e: TransportErr) {

        return sequential(this.handlers.map(h => wrap(h.onError(e)))).map(noop);

    }

    onClientError(r: Response<ErrorBody>) {

        return sequential(this.handlers.map(h => wrap(h.onClientError(r))))
            .map(noop);

    }

    onServerError(r: Response<ErrorBody>) {

        return sequential(this.handlers.map(h => wrap(h.onServerError(r)))).
            map(noop);

    }

    onBatchComplete(r: BatchResponse<B>) {

        return sequential(this.handlers.map(h => wrap(h.onBatchComplete(r)))).
            map(noop);

    }

}

/**
 * SendCallback sends a Send to a Remote's address, processing the response
 * with the provided handler.
 */
export class SendCallback<Req, Res>
    extends
    Callback<SendCallbackMessage<Res>> {

    constructor(
        public system: System,
        public remote: Address,
        public request: Request<Req>,
        public handler: CompleteHandler<Res>) { super(system); }

    receive() {

        return <Case<SendCallbackMessage<Res>>[]>[

            new Case(TransportErr, (e: TransportErr) => this.handler.onError(e)),

            new Case(typeMatch, (r: Response<Res>) => {

                if (r.code > 499) {

                    return this.handler.onServerError(<Response<ErrorBody>>r);

                } else if (r.code > 399) {

                    return this.handler.onClientError(<Response<ErrorBody>>r);

                } else {

                    return this.handler.onComplete(r);

                }

            })

        ];

    }

    run() {

        this.tell(this.remote, new Send(this.self(), this.request));

    }

}

/**
 * ParSendCallback sends a ParSend request to a remote, processing the result
 * with the provided handler.
 */
export class ParSendCallback<Req, Res>
    extends
    Callback<BatchCallbackMessage<Res>> {

    constructor(
        public system: System,
        public remote: Address,
        public requests: Request<Req>[],
        public handler: BatchCompleteHandler<Res>) { super(system); }

    receive() {

        return <Case<BatchCallbackMessage<Res>>[]>[

            new Case(TransportErr, (e: TransportErr) =>
                this.handler.onError(e)),

            new Case(BatchResponse, (r: BatchResponse<Res>) => {

                let failed = r.value.filter(r => r.code > 299);

                if (failed.length > 0) {

                    let res = failed[0];

                    if (res.code > 499) {

                        return this.handler.onServerError(
                          <Response<ErrorBody>>res);

                    } else {

                        return this.handler.onClientError(
                            <Response<ErrorBody>>res);

                    }

                } else {

                    return this.handler.onBatchComplete(r);

                }

            })

        ]

    }

    run() {

        this.tell(this.remote, new ParSend(this.self(), this.requests));

    }

}

/**
 * SeqSendCallback sends a SeqSend request to a remote, processing the
 * response using the provided handler.
 */
export class SeqSendCallback<Req, Res> extends ParSendCallback<Req, Res> {

    run() {

        this.tell(this.remote, new SeqSend(this.self(), this.requests));

    }

}
