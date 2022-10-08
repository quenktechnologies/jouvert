import { Object } from '@quenk/noni/lib/data/jsonx';
import { Spawner } from '@quenk/potoo/lib/actor/resident/api';
import { Address } from '@quenk/potoo/lib/actor/address';
import { CompleteHandler } from '../callback';
import { Result } from './handler/result';
import { SpawnFunc, RemoteModel, Paths } from './';
/**
 * SpawnSpec is a type providing a way to spawn a new actor.
 */
export declare type SpawnSpec = SpawnFunc | Spawner;
/**
 * CompleteHandlerSpec type allows one or more CompletHandlers to be specified.
 */
export declare type CompleteHandlerSpec<D extends Object> = CompleteHandler<Result<D>> | CompleteHandler<Result<D>>[];
/**
 * RemoteModelFactory is a convenience class for creating RemoteModel instances.
 */
export declare class RemoteModelFactory<T extends Object> {
    remote: Address;
    spawn: SpawnFunc;
    /**
     * @param remote   The address of the actor that will receive the network
     *                 requests.
     * @param spawn    A function that will be used to spawn needed actors.
     */
    constructor(remote: Address, spawn: SpawnFunc);
    /**
     * getInstance provides a new RemoteModelFactory instance.
     */
    static getInstance<T extends Object>(spawn: SpawnSpec, remote: Address): RemoteModelFactory<T>;
    /**
     * create a new RemoteModel using the internal configuration.
     *
     * @param paths    If a desired endpoint is missing the following are used:
     *                               create -> search || '?'
     *                               search -> create || '?'
     *                               update -> get || remove || '?'
     *                               get    -> update || remove || '?'
     *                               remove -> get || update || '?'
     *
     * @param handlers A handler or list of handlers to handle the response.
     *
     * @param context  An object that will be used to expand encountered URL
     *                 templates.
     */
    create(paths: Paths, handlers?: CompleteHandlerSpec<T>, context?: Object): RemoteModel<T>;
}
