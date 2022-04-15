import { Object } from '@quenk/noni/lib/data/jsonx';
import { Spawner } from '@quenk/potoo/lib/actor/resident/api';
import { Address } from '@quenk/potoo/lib/actor/address';
import { CompleteHandler } from '../callback';
import { SpawnFunc, RemoteModel, Result, Paths } from './';
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
    spawn: SpawnFunc;
    remote: Address;
    /**
     * @param spawn    A function that will be used to spawn needed actors.
     * @param remote   The address of the actor that will receive the network
     *                 requests.
     */
    constructor(spawn: SpawnFunc, remote: Address);
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
     * @param context  An object that will be used to expand encountered URL
     *                 templates.
     *
     * @param handlers A handler or list of handlers to handle the response.
     */
    create(paths: Paths, context?: {}, handlers?: CompleteHandlerSpec<T>): RemoteModel<T>;
}
