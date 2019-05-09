import * as index from './';
/**
 * SuspendedMessages type.
 */
export declare type SuspendedMessages<Req> = index.SuspendedMessages<Req>;
/**
 * ResumedMessages type.
 */
export declare type ResumedMessages<B, M> = index.ResumedMessages<B, M>;
/**
 * AbstractManager provides an interact for managing records fetched
 * from a database.
 */
export declare abstract class AbstractManager<Req, Body, Resumed> extends index.AbstractWorkflow<Req, Body, Resumed> {
}
