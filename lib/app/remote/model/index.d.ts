/**
 * Provides a base data model implementation based on the remote and callback
 * apis. NOTE: Responses received by this API are expected to be in the result
 * format specified.
 */
/** imports */
import { Future } from '@quenk/noni/lib/control/monad/future';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Object } from '@quenk/noni/lib/data/jsonx';
import { Record } from '@quenk/noni/lib/data/record';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Spawnable } from '@quenk/potoo/lib/actor/template';
import { Response } from '@quenk/jhr/lib/response';
import { Request } from '@quenk/jhr/lib/request';
import { Id, Model } from '../../model';
import { CompleteHandler } from '../callback';
import { Result } from './handler/result';
export { Model };
/**
 * SpawnFunc used by RemoteModels to spawn remote callbacks.
 */
export declare type SpawnFunc = (tmpl: Spawnable) => Address;
/**
 * Paths is a record of actor addresses to use for each of the CSUGR
 * operations of a RemoteModel.
 */
export interface Paths extends Record<Address> {
}
/**
 * BaseRemoteModel is a [[Model]] implementation that uses the remote actor API
 * underneath to provide a CSUGR interface.
 *
 * This class serves as a starting point and exists mostly for that generate
 * frontend models via Dagen templates. Use the [[RemoteModel]] class to create
 * RemoteModels manually.
 */
export declare abstract class BaseRemoteModel<T extends Object> implements Model<T> {
    remote: Address;
    spawn: SpawnFunc;
    handler: CompleteHandler<Result<T>>;
    constructor(remote: Address, spawn: SpawnFunc, handler?: CompleteHandler<Result<T>>);
    /**
     * send a request to the remote backend.
     *
     * Use this method to submit the request to the remote actor using
     * the optional installed handler(s) to handle the request before completion.
     */
    send(req: Request<Object>): Future<Response<Result<T>>>;
    abstract create(data: T): Future<Id>;
    abstract search(qry: Object): Future<T[]>;
    abstract update(id: Id, changes: Partial<T>): Future<boolean>;
    abstract get(id: Id): Future<Maybe<T>>;
    abstract remove(id: Id): Future<boolean>;
}
/**
 * RemoteModel implementation
 */
export declare class RemoteModel<T extends Object> extends BaseRemoteModel<T> {
    remote: Address;
    paths: Paths;
    spawn: SpawnFunc;
    context: Object;
    handler: CompleteHandler<Result<T>>;
    constructor(remote: Address, paths: Paths, spawn: SpawnFunc, context?: Object, handler?: CompleteHandler<Result<T>>);
    create(data: T): Future<Id>;
    search(qry: Object): Future<T[]>;
    update(id: Id, changes: Partial<T>): Future<boolean>;
    get(id: Id): Future<Maybe<T>>;
    remove(id: Id): Future<boolean>;
}
