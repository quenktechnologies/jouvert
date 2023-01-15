/**
 * Provides a base data model implementation based on the remote and callback
 * APIs. NOTE: Responses received by this API are expected to be in the result
 * format specified.
 */
/** imports */
import { Future } from '@quenk/noni/lib/control/monad/future';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Object } from '@quenk/noni/lib/data/jsonx';
import { Record } from '@quenk/noni/lib/data/record';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Spawner } from '@quenk/potoo/lib/actor/resident/api';
import { Response } from '@quenk/jhr/lib/response';
import { Request } from '@quenk/jhr/lib/request';
import { RequestDecorator } from '../request/decorators';
import { Id, Model } from '../../model';
import { CompleteHandler } from '../callback';
import { Result, CreateResult, GetResult, SearchResult, RequestFactory } from '../../model/http';
export { Id, Model, Result, CreateResult, GetResult, SearchResult, RequestFactory };
/**
 * Paths is a record of actor addresses to use for each of the CSUGR
 * operations of a RemoteModel.
 */
export interface Paths extends Record<Address> {
}
/**
 * RequestAdaptable is an interface for modifying the [[Request]] object a
 * RemoteModel generates before it is sent.
 */
export interface RequestAdaptable<B> {
    /**
     * onRequest callback.
     */
    onRequest(rq: Request<B>): Request<B>;
}
export declare const NO_PATH = "invalid";
/**
 * RemoteModel is a [[Model]] implementation that uses the remote actor API
 * underneath to provide a CSUGR interface.
 *
 * This class serves as a starting point and exists mostly for that generate
 * frontend models via Dagen templates. Use the [[RemoteModel]] class to create
 * RemoteModels manually.
 */
export declare abstract class RemoteModel<T extends Object> implements Model<T> {
    remote: Address;
    actor: Spawner;
    handler: CompleteHandler<Result<T>>;
    decorator: RequestDecorator<T>;
    /**
     * @param remote    - The actor to send requests to.
     * @param actor     - The function used to spawn callbacks internally.
     * @param handler   - An optional CompleteHandler that can intercept
     *                    responses.
     * @param decorator - If supplied, can modify requests before sending.
     */
    constructor(remote: Address, actor: Spawner, handler?: CompleteHandler<Result<T>>, decorator?: RequestDecorator<T>);
    /**
     * requests is a factory object that generates the requests sent by this
     * actor.
     */
    abstract requests: RequestFactory;
    /**
     * send a request to the remote back-end.
     *
     * Use this method to submit the request to the remote actor using
     * the optional installed handler(s) to handle the request before completion.
     */
    send(req: Request<Object>): Future<Response<Result<T>>>;
    create(data: T): Future<Id>;
    search(qry: Object): Future<T[]>;
    update(id: Id, changes: Partial<T>): Future<boolean>;
    get(id: Id): Future<Maybe<T>>;
    remove(id: Id): Future<boolean>;
}
/**
 * GenericRemoteModel allows for the paths property to be specified in the
 * constructor.
 *
 * This is not the case in RemoteModel to allow auto generated code to implement
 * more easily.
 */
export declare class GenericRemoteModel<T extends Object> extends RemoteModel<T> {
    remote: Address;
    actor: Spawner;
    paths: Paths;
    handler: CompleteHandler<Result<T>>;
    decorator: RequestDecorator<T>;
    /**
     * @param remote    - The actor to send requests to.
     * @param actor     - The actor used to spawn callbacks internally.
     * @param handler   - An optional CompleteHandler that can intercept
     *                    responses.
     * @param decorator - If supplied, can modify requests before sending.
     */
    constructor(remote: Address, actor: Spawner, paths?: Paths, handler?: CompleteHandler<Result<T>>, decorator?: RequestDecorator<T>);
    requests: RequestFactory;
}
