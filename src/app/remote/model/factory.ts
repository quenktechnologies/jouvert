import { Object } from '@quenk/noni/lib/data/jsonx';
import { isObject } from '@quenk/noni/lib/data/type';

import { merge } from '@quenk/noni/lib/data/record';
import { Spawner } from '@quenk/potoo/lib/actor/resident/api';
import { Address } from '@quenk/potoo/lib/actor/address';

import { CompleteHandler, CompositeCompleteHandler } from '../callback';
import { SpawnFunc, RemoteModel, Result, Paths } from './';

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
    create(
        paths: Paths,
        context = {},
        handlers: CompleteHandlerSpec<T> = []
    ): RemoteModel<T> {

        return new RemoteModel(this.remote, normalize(paths),
            this.spawn, context, Array.isArray(handlers) ?
            new CompositeCompleteHandler(handlers) : handlers);

    }

}


const normalize = (paths: Paths) =>
    merge(paths, {

        create: paths.create || paths.search,

        search: paths.search || paths.create,

        update: paths.update || paths.get || paths.remove,

        get: paths.get || paths.update || paths.remove,

        remove: paths.remove || paths.update || paths.get

    })
