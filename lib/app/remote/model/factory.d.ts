import { Object } from '@quenk/noni/lib/data/jsonx';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Api } from '@quenk/potoo/lib/actor/resident/api';
import { RemoteModel, Result } from '.';
import { CompleteHandler } from '../callback';
/**
 * RemoteModelFactory is a convenience class for creating RemoteModel instances.
 */
export declare class RemoteModelFactory<T extends Object> {
    remote: Address;
    parent: Api;
    constructor(remote: Address, parent: Api);
    static getInstance<T extends Object>(remote: Address, parent: Api): RemoteModelFactory<T>;
    /**
     * create a new RemoteModel based on teh path specified.
     */
    create(path: string, handler?: CompleteHandler<Result<T>>): RemoteModel<T>;
}
