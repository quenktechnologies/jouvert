import * as index from './';

/**
 * SuspendedMessages type.
 */
export type SuspendedMessages<Req> = index.SuspendedMessages<Req>;

/**
 * ResumedMessages type.
 */
export type ResumedMessages<B> = index.ResumedMessages<B>;

/**
 * AbstractProfile provides an interact for managing the data of a single
 * record.
 */
export abstract class AbstractProfile<Req, Body>
    extends
    index.AbstractWorkflow<Req, Body> { }
