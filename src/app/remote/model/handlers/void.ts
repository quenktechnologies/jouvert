import { AbstractCompleteHandler } from '../../callback';

/**
 * VoidHandler is a [[CompleteHandler]] that expects the body of the
 * result to be empty.
 *
 * It does nothing.
 */
export class VoidHandler<T = void> extends AbstractCompleteHandler<T>{ }
