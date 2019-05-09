/**
 * This module provides interfaces and cases for loading from http requests
 * specifically.
 *
 * It differs from the `http/response` module in that responses here
 * continue the loading behaviour.
 */
/** imports */
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Loading } from '../';
/**
 * OkListener
 */
export interface OkListener<R, T, MLoading> extends Loading<T, MLoading> {
    /**
     * afterOk hook.
     */
    afterOk(res: R): OkListener<R, T, MLoading>;
}
/**
 * CreatedListener
 */
export interface CreatedListener<R, T, MLoading> extends Loading<T, MLoading> {
    /**
     * afterCreated hook.
     */
    afterCreated(res: R): CreatedListener<R, T, MLoading>;
}
/**
 * NoContentListener
 */
export interface NoContentListener<R, T, MLoading> extends Loading<T, MLoading> {
    /**
     * afterNoContent hook.
     */
    afterNoContent(res: R): NoContentListener<R, T, MLoading>;
}
/**
 * BadRequestListener
 */
export interface BadRequestListener<R, T, MLoading> extends Loading<T, MLoading> {
    /**
     * afterBadRequest hook.
     */
    afterBadRequest(res: R): BadRequestListener<R, T, MLoading>;
}
/**
 * ConflictListener
 */
export interface ConflictListener<R, T, MLoading> extends Loading<T, MLoading> {
    /**
     * afterConflict hook.
     */
    afterConflict(res: R): ConflictListener<R, T, MLoading>;
}
/**
 * ForbiddenListener
 */
export interface ForbiddenListener<R, T, MLoading> extends Loading<T, MLoading> {
    /**
     * afterForbidden hook.
     */
    afterForbidden(res: R): ForbiddenListener<R, T, MLoading>;
}
/**
 * UnauthorizedListener
 */
export interface UnauthorizedListener<R, T, MLoading> extends Loading<T, MLoading> {
    /**
     * afterUnauthorized hook.
     */
    afterUnauthorized(res: R): UnauthorizedListener<R, T, MLoading>;
}
/**
 * NotFoundListener
 */
export interface NotFoundListener<R, T, MLoading> extends Loading<T, MLoading> {
    /**
     * afterNotFound hook.
     */
    afterNotFound(res: R): NotFoundListener<R, T, MLoading>;
}
/**
 * ServerErrorListener
 */
export interface ServerErrorListener<R, T, MLoading> extends Loading<T, MLoading> {
    /**
     * afterServerError hook.
     */
    afterServerError(res: R): ServerErrorListener<R, T, MLoading>;
}
/**
 * OkCase dispatches the afterOk hook and resumes.
 */
export declare class OkCase<R, T, MLoading> extends Case<R> {
    pattern: Constructor<R>;
    token: T;
    listener: OkListener<R, T, MLoading>;
    constructor(pattern: Constructor<R>, token: T, listener: OkListener<R, T, MLoading>);
}
/**
 * CreatedCase dispatches the afterCreated hook and resumes.
 */
export declare class CreatedCase<R, T, MLoading> extends Case<R> {
    pattern: Constructor<R>;
    token: T;
    listener: CreatedListener<R, T, MLoading>;
    constructor(pattern: Constructor<R>, token: T, listener: CreatedListener<R, T, MLoading>);
}
/**
 * NoContentCase dispatches the afterNoContent hook and resumes.
 */
export declare class NoContentCase<R, T, MLoading> extends Case<R> {
    pattern: Constructor<R>;
    token: T;
    listener: NoContentListener<R, T, MLoading>;
    constructor(pattern: Constructor<R>, token: T, listener: NoContentListener<R, T, MLoading>);
}
/**
 * BadRequestCase dispatches afterBadRequest hook and resumes.
 */
export declare class BadRequestCase<R, T, MLoading> extends Case<R> {
    pattern: Constructor<R>;
    token: T;
    listener: BadRequestListener<R, T, MLoading>;
    constructor(pattern: Constructor<R>, token: T, listener: BadRequestListener<R, T, MLoading>);
}
/**
 * ConflictCase dispatches afterConflict hook and resumes.
 */
export declare class ConflictCase<R, T, MLoading> extends Case<R> {
    pattern: Constructor<R>;
    token: T;
    listener: ConflictListener<R, T, MLoading>;
    constructor(pattern: Constructor<R>, token: T, listener: ConflictListener<R, T, MLoading>);
}
/**
 * ForbiddenCase dispatches the afterForbbidden hook and resumes.
 */
export declare class ForbiddenCase<R, T, MLoading> extends Case<R> {
    pattern: Constructor<R>;
    token: T;
    listener: ForbiddenListener<R, T, MLoading>;
    constructor(pattern: Constructor<R>, token: T, listener: ForbiddenListener<R, T, MLoading>);
}
/**
 * UnauthorizedCase dispatches the afterUnauthorized hook and resumes.
 */
export declare class UnauthorizedCase<R, T, MLoading> extends Case<R> {
    pattern: Constructor<R>;
    token: T;
    listener: UnauthorizedListener<R, T, MLoading>;
    constructor(pattern: Constructor<R>, token: T, listener: UnauthorizedListener<R, T, MLoading>);
}
/**
 * NotFoundCase dispatches the afterNotFound hook and resumes.
 */
export declare class NotFoundCase<R, T, MLoading> extends Case<R> {
    pattern: Constructor<R>;
    token: T;
    listener: NotFoundListener<R, T, MLoading>;
    constructor(pattern: Constructor<R>, token: T, listener: NotFoundListener<R, T, MLoading>);
}
/**
 * ServerErrorCase dispatches the afterServerError hook and resumes.
 */
export declare class ServerErrorCase<R, T, MLoading> extends Case<R> {
    pattern: Constructor<R>;
    token: T;
    listener: ServerErrorListener<R, T, MLoading>;
    constructor(pattern: Constructor<R>, token: T, listener: ServerErrorListener<R, T, MLoading>);
}
