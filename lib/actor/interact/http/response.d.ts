/**
 * Sometimes an Interact needs to receive http responses in order to
 * properly stream its content.
 *
 * This module provides listeners for common http responses. The workflow
 * here puts the Interact in the resumed behaviour after each response.
 */
/** imports */
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Resumed } from '../';
/**
 * OkListener
 */
export interface OkListener<A, R, MResumed> extends Resumed<R, MResumed> {
    /**
     * afterOk hook.
     */
    afterOk(res: A): OkListener<A, R, MResumed>;
}
/**
 * CreatedListener
 */
export interface CreatedListener<A, R, MResumed> extends Resumed<R, MResumed> {
    /**
     * afterCreated hook.
     */
    afterCreated(res: A): CreatedListener<A, R, MResumed>;
}
/**
 * NoContentListener
 */
export interface NoContentListener<A, R, MResumed> extends Resumed<R, MResumed> {
    /**
     * afterNoContent hook.
     */
    afterNoContent(res: A): NoContentListener<A, R, MResumed>;
}
/**
 * BadRequestListener
 */
export interface BadRequestListener<A, R, MResumed> extends Resumed<R, MResumed> {
    /**
     * afterBadRequest hook.
     */
    afterBadRequest(res: A): BadRequestListener<A, R, MResumed>;
}
/**
 * ConflictListener
 */
export interface ConflictListener<A, R, MResumed> extends Resumed<R, MResumed> {
    /**
     * afterConflict hook.
     */
    afterConflict(res: A): ConflictListener<A, R, MResumed>;
}
/**
 * ForbiddenListener
 */
export interface ForbiddenListener<A, R, MResumed> extends Resumed<R, MResumed> {
    /**
     * afterForbidden hook.
     */
    afterForbidden(res: A): ForbiddenListener<A, R, MResumed>;
}
/**
 * UnauthorizedListener
 */
export interface UnauthorizedListener<A, R, MResumed> extends Resumed<R, MResumed> {
    /**
     * afterUnauthorized hook.
     */
    afterUnauthorized(res: A): UnauthorizedListener<A, R, MResumed>;
}
/**
 * NotFoundListener
 */
export interface NotFoundListener<A, R, MResumed> extends Resumed<R, MResumed> {
    /**
     * afterNotFound hook.
     */
    afterNotFound(res: A): NotFoundListener<A, R, MResumed>;
}
/**
 * ServerErrorListener
 */
export interface ServerErrorListener<A, R, MResumed> extends Resumed<R, MResumed> {
    /**
     * afterServerError hook.
     */
    afterServerError(res: A): ServerErrorListener<A, R, MResumed>;
}
/**
 * OkCase dispatches the afterOk hook and resumes.
 */
export declare class OkCase<A, R, MResumed> extends Case<A> {
    pattern: Constructor<A>;
    token: R;
    listener: OkListener<A, R, MResumed>;
    constructor(pattern: Constructor<A>, token: R, listener: OkListener<A, R, MResumed>);
}
/**
 * CreatedCase dispatches the afterCreated hook and resumes.
 */
export declare class CreatedCase<A, R, MResumed> extends Case<A> {
    pattern: Constructor<A>;
    token: R;
    listener: CreatedListener<A, R, MResumed>;
    constructor(pattern: Constructor<A>, token: R, listener: CreatedListener<A, R, MResumed>);
}
/**
 * NoContentCase dispatches the afterNoContent hook and resumes.
 */
export declare class NoContentCase<A, R, MResumed> extends Case<A> {
    pattern: Constructor<A>;
    token: R;
    listener: NoContentListener<A, R, MResumed>;
    constructor(pattern: Constructor<A>, token: R, listener: NoContentListener<A, R, MResumed>);
}
/**
 * BadRequestCase dispatches afterBadRequest hook and resumes.
 */
export declare class BadRequestCase<A, R, MResumed> extends Case<A> {
    pattern: Constructor<A>;
    token: R;
    listener: BadRequestListener<A, R, MResumed>;
    constructor(pattern: Constructor<A>, token: R, listener: BadRequestListener<A, R, MResumed>);
}
/**
 * ConflictCase dispatches afterConflict hook and resumes.
 */
export declare class ConflictCase<A, R, MResumed> extends Case<A> {
    pattern: Constructor<A>;
    token: R;
    listener: ConflictListener<A, R, MResumed>;
    constructor(pattern: Constructor<A>, token: R, listener: ConflictListener<A, R, MResumed>);
}
/**
 * ForbiddenCase dispatches the afterForbbidden hook and resumes.
 */
export declare class ForbiddenCase<A, R, MResumed> extends Case<A> {
    pattern: Constructor<A>;
    token: R;
    listener: ForbiddenListener<A, R, MResumed>;
    constructor(pattern: Constructor<A>, token: R, listener: ForbiddenListener<A, R, MResumed>);
}
/**
 * UnauthorizedCase dispatches the afterUnauthorized hook and resumes.
 */
export declare class UnauthorizedCase<A, R, MResumed> extends Case<A> {
    pattern: Constructor<A>;
    token: R;
    listener: UnauthorizedListener<A, R, MResumed>;
    constructor(pattern: Constructor<A>, token: R, listener: UnauthorizedListener<A, R, MResumed>);
}
/**
 * NotFoundCase dispatches the afterNotFound hook and resumes.
 */
export declare class NotFoundCase<A, R, MResumed> extends Case<A> {
    pattern: Constructor<A>;
    token: R;
    listener: NotFoundListener<A, R, MResumed>;
    constructor(pattern: Constructor<A>, token: R, listener: NotFoundListener<A, R, MResumed>);
}
/**
 * ServerErrorCase dispatches the afterServerError hook and resumes.
 */
export declare class ServerErrorCase<A, R, MResumed> extends Case<A> {
    pattern: Constructor<A>;
    token: R;
    listener: ServerErrorListener<A, R, MResumed>;
    constructor(pattern: Constructor<A>, token: R, listener: ServerErrorListener<A, R, MResumed>);
}
