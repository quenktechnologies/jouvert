import { Object } from '@quenk/noni/lib/data/jsonx';
import { isObject } from '@quenk/noni/lib/data/type';

import { Spawner } from '@quenk/potoo/lib/actor/resident/api';
import { Address } from '@quenk/potoo/lib/actor/address';

import { CompleteHandler, CompositeCompleteHandler } from '../callback';
import { SpawnFunc, RemoteModel, Result } from './';

/**
 * SpawnSpec is a type providing a way to spawn a new actor.
 */
export type SpawnSpec
    = SpawnFunc
    | Spawner
    ;

/**
 * CompleteHandlerSpec type allows one or more CompletHandlers to be specified.
 */
export type CompleteHandlerSpec<D extends Object>
    = CompleteHandler<Result<D>>
    | CompleteHandler<Result<D>>[]
    ;

/**
 * RemoteModelFactory is a convenience class for creating RemoteModel instances.
 */
export class RemoteModelFactory<T extends Object> {

    /**
     * @param spawn    A function that will be used to spawn needed actors.
     * @param remote   The address of the actor that will receive the network 
     *                 requests.
     */
    constructor(public spawn: SpawnFunc, public remote: Address) { }

    /**
     * getInstance provides a new RemoteModelFactory instance.
     */
    static getInstance<T extends Object>(spawn: SpawnSpec, remote: Address)
        : RemoteModelFactory<T> {

        return new RemoteModelFactory(isObject(spawn) ?
            (<Spawner>spawn).spawn.bind(spawn) : spawn, remote);

    }

    /**
     * create a new RemoteModel based on teh path specified.
     */
    create(path: string, handlers?: CompleteHandlerSpec<T>): RemoteModel<T> {

        return new RemoteModel(this.remote, path,
            this.spawn, Array.isArray(handlers) ?
            new CompositeCompleteHandler(handlers) : handlers);

    }

}
