/**
 * This module provides actors for sending requests to a [[Remote]] and
 * executing some action depending on the result. Callbacks should be spawned
 * each time a parent actor wants to make a request, once a response is
 * received, they exit. The response from the request can be handled
 * by specifying a handler object to the callback's constructor.
 */
import { Request } from '@quenk/jhr/lib/request';
import { Response } from '@quenk/jhr/lib/response';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Temp } from '@quenk/potoo/lib/actor/resident';
import { Address } from '@quenk/potoo/lib/actor/address';
import { System } from '@quenk/potoo/lib/actor/system';
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
 * FailHandler is a handler that deals with the failure of requests.
 *
 * The other handler interfaces inherit from this.
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
 * CompleteHandler provides a method for handling successful non-batch requests.
 */
export interface CompleteHandler<B> extends FailHandler {
    /**
     * onComplete handler.
     */
    onComplete(r: Response<B>): void;
}
/**
 * BatchComplete provides a method for handling successful batch request.
 */
export interface BatchCompleteHandler<B> extends FailHandler {
    /**
     * onBatchComplete handler.
     */
    onBatchComplete(r: BatchResponse<B>): void;
}
/**
 * AbstractCompleteHandler can be extended to partially implement a
 * [[CompleteHandler]].
 */
export declare class AbstractCompleteHandler<B> implements CompleteHandler<B> {
    onError(_: TransportErr): void;
    onClientError(_: Response<ErrorBody>): void;
    onServerError(_: Response<ErrorBody>): void;
    onComplete(_: Response<B>): void;
}
/**
 * AbstractBatchCompleteHandler can be extended to partially implement a
 * [[BatchCompleteHandler]].
 */
export declare class AbstractBatchCompleteHandler<B> extends AbstractCompleteHandler<B> implements BatchCompleteHandler<B> {
    onBatchComplete(_: BatchResponse<B>): void;
}
/**
 * CompositeCompleteHandler allows multiple [[CompleteHandler]]s to be used as
 * one.
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
 * CompositeBatchCompleteHandler allows multiple [[BatchCompleteHandler]]s to
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
export declare class SendCallback<Req, Res> extends Temp<SendCallbackMessage<Res>> {
    system: System;
    remote: Address;
    request: Request<Req>;
    handler: CompleteHandler<Res>;
    constructor(system: System, remote: Address, request: Request<Req>, handler: CompleteHandler<Res>);
    receive(): Case<SendCallbackMessage<Res>>[];
    run(): void;
}
/**
 * ParSendCallback sends a ParSend request to a remote, processing the result
 * with the provided handler.
 */
export declare class ParSendCallback<Req, Res> extends Temp<BatchCallbackMessage<Res>> {
    system: System;
    remote: Address;
    requests: Request<Req>[];
    handler: BatchCompleteHandler<Res>;
    constructor(system: System, remote: Address, requests: Request<Req>[], handler: BatchCompleteHandler<Res>);
    receive(): Case<BatchCallbackMessage<Res>>[];
    run(): void;
}
/**
 * SeqSendCallback sends a SeqSend request to a remote, processing the
 * response using the provided handler.
 */
export declare class SeqSendCallback<Req, Res> extends ParSendCallback<Req, Res> {
    run(): void;
}
