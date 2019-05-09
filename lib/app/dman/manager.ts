import * as index from './';

/**
 * SuspendedMessages type.
 */
export type SuspendedMessages<Req> = index.SuspendedMessages<Req>;

/**
 * ResumedMessages type.
 */
export type ResumedMessages<B, M> = index.ResumedMessages<B, M>;

/**
 * AbstractManager provides an interact for managing records fetched
 * from a database.
 */
export abstract class AbstractManager<Req, Body, Resumed>
    extends
    index.AbstractWorkflow<Req, Body, Resumed> { }

