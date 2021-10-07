import { Object } from '@quenk/noni/lib/data/jsonx';
import { Address } from '@quenk/potoo/lib/actor/address';
import { CompleteHandler } from '../callback';
import { SpawnFunc, RemoteModel, Result } from './';
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
    static getInstance<T extends Object>(spawn: SpawnFunc, remote: Address): RemoteModelFactory<T>;
    /**
     * create a new RemoteModel based on teh path specified.
     */
    create(path: string, handlers?: CompleteHandlerSpec<T>): RemoteModel<T>;
}
