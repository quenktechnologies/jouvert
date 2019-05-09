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
 * AbstractProfile provides an interact for managing the data of a single
 * record.
 */
export declare abstract class AbstractProfile<Req, Body, Resumed> extends index.AbstractWorkflow<Req, Body, Resumed> {
}
