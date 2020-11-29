import { Request } from '@quenk/jhr/lib/request';
import { Response } from '@quenk/jhr/lib/response';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Immutable } from '../../actor';
import { JApp } from '../';
import { Send, ParSend, SeqSend, BatchResponse, TransportErr } from './';
export { Send, ParSend, SeqSend };
/**
 * SendCallbackMessage type.
 */
export declare type SendCallbackMessage<B> = Response<B> | TransportErr;
/**
 * BatchCallbackMessage type.
 */
export declare type BatchCallbackMessage<B> = BatchResponse<B> | TransportErr;
/**
 * ErrorBody provides details about why a request failed.
 */
export interface ErrorBody {
    /**
     * error details.
     */
    errors?: Object;
}
/**
 * FailHandler provides callbacks for failed network requests.
 */
export interface FailHandler {
    /**
     * onError is invoked if a TransportErr occurs.
     */
    onError(e: TransportErr): void;
    /**
     * onClientError is invoked if the response status indicates a client
     * error.
     */
    onClientError(r: Response<ErrorBody>): void;
    /**
     * onServerError is invoked if the response status indicates a server
     * error.
     */
    onServerError(r: Response<ErrorBody>): void;
}
/**
 * CompleteHandler adds the onComplete callback for handling successful
 * requests.
 */
export interface CompleteHandler<B> extends FailHandler {
    /**
     * onComplete is invoked on the successful completion of a request.
     */
    onComplete(r: Response<B>): void;
}
/**
 * BatchComplete handler adds the onBatchComplete callback for successful
 * batch requests.
 */
export interface BatchCompleteHandler<B> extends FailHandler {
    /**
     * onBatchComplete is invoked on the successful completion of a batch request.
     */
    onBatchComplete(r: BatchResponse<B>): void;
}
/**
 * AbstractCompleteHandler can be extended to partially implement the
 * CompleteHandler API.
 */
export declare class AbstractCompleteHandler<B> implements CompleteHandler<B> {
    onError(_: TransportErr): void;
    onClientError(_: Response<ErrorBody>): void;
    onServerError(_: Response<ErrorBody>): void;
    onComplete(_: Response<B>): void;
}
/**
 * AbstractBatchCompleteHandler can be extended to partially implement the
 * BatchCompleteHandler API.
 */
export declare class AbstractBatchCompleteHandler<B> extends AbstractCompleteHandler<B> implements BatchCompleteHandler<B> {
    onBatchComplete(_: BatchResponse<B>): void;
}
/**
 * CompositeCompleteHandler allows multiple CompleteHandlers to be used as one.
 */
export declare class CompositeCompleteHandler<B> implements CompleteHandler<B> {
    handlers: CompleteHandler<B>[];
    constructor(handlers: CompleteHandler<B>[]);
    onError(e: TransportErr): void;
    onClientError(r: Response<ErrorBody>): void;
    onServerError(r: Response<ErrorBody>): void;
    onComplete(r: Response<B>): void;
}
/**
 * CompositeBatchCompleteHandler allows multiple BatchCompleteHandlers to
 * be used as one.
 */
export declare class CompositeBatchCompleteHandler<B> implements BatchCompleteHandler<B> {
    handlers: BatchCompleteHandler<B>[];
    constructor(handlers: BatchCompleteHandler<B>[]);
    onError(e: TransportErr): void;
    onClientError(r: Response<ErrorBody>): void;
    onServerError(r: Response<ErrorBody>): void;
    onBatchComplete(r: BatchResponse<B>): void;
}
/**
 * SendCallback sends a Send to a Remote's address, processing the response
 * with the provided handler.
 */
export declare class SendCallback<Req, Res> extends Immutable<SendCallbackMessage<Res>> {
    system: JApp;
    remote: Address;
    request: Request<Req>;
    handler: CompleteHandler<Res>;
    constructor(system: JApp, remote: Address, request: Request<Req>, handler: CompleteHandler<Res>);
    receive: Case<SendCallbackMessage<Res>>[];
    run(): void;
}
/**
 * ParSendCallback sends a ParSend request to a remote, processing the result
 * with the provided handler.
 */
export declare class ParSendCallback<Req, Res> extends Immutable<BatchCallbackMessage<Res>> {
    system: JApp;
    remote: Address;
    requests: Request<Req>[];
    handler: BatchCompleteHandler<Res>;
    constructor(system: JApp, remote: Address, requests: Request<Req>[], handler: BatchCompleteHandler<Res>);
    receive: Case<BatchCallbackMessage<Res>>[];
    run(): void;
}
/**
 * SeqSendCallback sends a SeqSend request to a remote, processing the
 * response using the provided handler.
 */
export declare class SeqSendCallback<Req, Res> extends ParSendCallback<Req, Res> {
    run(): void;
}
