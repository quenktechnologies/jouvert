import { Object } from '@quenk/noni/lib/data/jsonx';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Future } from '@quenk/noni/lib/control/monad/future';
/**
 * Id is a valid unique identifier for a single record.
 */
export type Id = string | number;
/**
 * Model is an interface for preforming CSUGR operations on a data
 * type found in the application we are interested in persisting.
 *
 * Actual implementations may manipulate data stored on the client side or
 * a remote endpoint.
 */
export interface Model<T extends Object> {
    /**
     * create a new entry for the data type.
     */
    create(data: T): Future<Id>;
    /**
     * search for entries that match the specified query criteria.
     */
    search(qry: Object): Future<T[]>;
    /**
     * update a single entry with the data provided.
     */
    update(id: Id, changes: Partial<T>): Future<boolean>;
    /**
     * get a single entry using its id.
     */
    get(id: Id): Future<Maybe<T>>;
    /**
     * remove a single entry using its id
     */
    remove(id: Id): Future<boolean>;
}
