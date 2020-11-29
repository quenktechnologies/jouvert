import { Any } from '@quenk/noni/lib/data/type';
import { Request } from '@quenk/jhr/lib/request';
import { Response } from '@quenk/jhr/lib/response';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';

import { Immutable } from '../../actor';
import { JApp } from '../';
import {
    Send,
    ParSend,
    SeqSend,
    BatchResponse,
    TransportErr
} from './';

export { Send, ParSend, SeqSend }

const typeMatch = { code: Number, options: Object, body: Any, headers: Object };

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
 * FailHandler provides callbacks for failed network requests.
 */
export interface FailHandler {

    /**
     * onError is invoked if a TransportErr occurs.
     */
    onError(e: TransportErr): void

    /**
     * onClientError is invoked if the response status indicates a client
     * error.
     */
    onClientError(r: Response<ErrorBody>): void

    /**
     * onServerError is invoked if the response status indicates a server
     * error.
     */
    onServerError(r: Response<ErrorBody>): void

}

/**
 * CompleteHandler adds the onComplete callback for handling successful 
 * requests.
 */
export interface CompleteHandler<B> extends FailHandler {

    /**
     * onComplete is invoked on the successful completion of a request.
     */
    onComplete(r: Response<B>): void

}

/**
 * BatchComplete handler adds the onBatchComplete callback for successful 
 * batch requests.
 */
export interface BatchCompleteHandler<B> extends FailHandler {

    /**
     * onBatchComplete is invoked on the successful completion of a batch request.
     */
    onBatchComplete(r: BatchResponse<B>): void

}

/**
 * AbstractCompleteHandler can be extended to partially implement the
 * CompleteHandler API.
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
 * AbstractBatchCompleteHandler can be extended to partially implement the 
 * BatchCompleteHandler API.
 */
export class AbstractBatchCompleteHandler<B>
    extends AbstractCompleteHandler<B>
    implements BatchCompleteHandler<B> {

    onBatchComplete(_: BatchResponse<B>) { }

}

/**
 * CompositeCompleteHandler allows multiple CompleteHandlers to be used as one.
 */
export class CompositeCompleteHandler<B>
    implements
    CompleteHandler<B> {

    constructor(public handlers: CompleteHandler<B>[]) { }

    onError(e: TransportErr) {

        this.handlers.forEach(h => h.onError(e));

    }

    onClientError(r: Response<ErrorBody>) {

        this.handlers.forEach(h => h.onClientError(r));

    }

    onServerError(r: Response<ErrorBody>) {

        this.handlers.forEach(h => h.onServerError(r));

    }

    onComplete(r: Response<B>) {

        this.handlers.forEach(h => h.onComplete(r));

    }

}

/**
 * CompositeBatchCompleteHandler allows multiple BatchCompleteHandlers to 
 * be used as one.
 */
export class CompositeBatchCompleteHandler<B>
    implements
    BatchCompleteHandler<B> {

    constructor(public handlers: BatchCompleteHandler<B>[]) { }

    onError(e: TransportErr) {

        this.handlers.forEach(h => h.onError(e));

    }

    onClientError(r: Response<ErrorBody>) {

        this.handlers.forEach(h => h.onClientError(r));

    }

    onServerError(r: Response<ErrorBody>) {

        this.handlers.forEach(h => h.onServerError(r));

    }

    onBatchComplete(r: BatchResponse<B>) {

        this.handlers.forEach(h => h.onBatchComplete(r));

    }

}

/**
 * SendCallback sends a Send to a Remote's address, processing the response
 * with the provided handler.
 */
export class SendCallback<Req, Res>
    extends
    Immutable<SendCallbackMessage<Res>> {

    constructor(
        public system: JApp,
        public remote: Address,
        public request: Request<Req>,
        public handler: CompleteHandler<Res>) { super(system); }

    receive = <Case<SendCallbackMessage<Res>>[]>[

        new Case(TransportErr, (e: TransportErr) => {

            this.handler.onError(e);
            this.exit();

        }),

        new Case(typeMatch, (r: Response<Res>) => {

            if (r.code > 499) {

                this.handler.onServerError(r);

            } else if (r.code > 399) {

                this.handler.onClientError(r);

            } else {

                this.handler.onComplete(r);

            }

            this.exit();

        })

    ]

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
    Immutable<BatchCallbackMessage<Res>> {

    constructor(
        public system: JApp,
        public remote: Address,
        public requests: Request<Req>[],
        public handler: BatchCompleteHandler<Res>) { super(system); }

    receive = <Case<BatchCallbackMessage<Res>>[]>[

        new Case(TransportErr, (e: TransportErr) => {

            this.handler.onError(e);
            this.exit();

        }),

        new Case(BatchResponse, (r: BatchResponse<Res>) => {

            let failed = r.value.filter(r => r.code > 299);

            if (failed.length > 0) {

                let res = failed[0];

                if (res.code > 499) {

                    this.handler.onServerError(res);

                } else {

                    this.handler.onClientError(res);

                }

            } else {

                this.handler.onBatchComplete(r);

            }

            this.exit();

        })

    ]

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
