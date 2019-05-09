/**
 * This module provides a shell of an application used for managing various
 * records from a database. 
 *
 * It is highly opinionated and structured as follows:
 *
 * There are two main workflows, the Manager and the Profile workflow.
 *
 * The Manager is meant for displaying and managing multiple records like an
 * index. The Profile is used for single records. Both of these interacts 
 * inherit from the main Workflow interface which generally attempts to load 
 * the data before displaying it.
 *
 * The service submodule contains supporting actors for displaying temporary
 * content, forms and batch loading data. The workflow has behaviour cases
 * for listening for FormService messages as well as data loaded using the
 * FetchService.
 *
 * It is up to implementations to decide how to treat with those messages.
 */
/** imports */
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import {
    Resume,
    Suspend,
    Ack
} from '../../actor/api/router/display';
import {
    ResumeListener,
    SuspendListener,
    SuspendCase,
    ResumeCase
} from '../../actor/interact';
import {
    AbortedListener,
    SavedListener,
    AbortedCase,
    SavedCase
} from '../../actor/interact/data/form/client';
import { Mutable } from '../../actor';
import {
    FetchFinishListener,
    Start,
    FetchFinishError,
    FetchFinishOk,
    FetchFinishErrorCase,
    FetchFinishOkCase
} from './service/fetch';
import { Stream } from './service/content';
import { FormSaved, FormAborted } from './service/form';

/**
 * Group type.
 */
export type Group = string;

/**
 * SuspendedMessages type.
 */
export type SuspendedMessages<Req>
    = Resume<Req>
    ;

/**
 * ResumedMessages
 */
export type ResumedMessages<B, M>
    = FetchFinishError
    | FetchFinishOk<B>
    | Suspend
    | M
    ;

/**
 * Workflow describes an interact for managing data fetched from the
 * remote host.
 */
export interface Workflow<Req, Body, Resumed>
    extends
    ResumeListener<Resume<Req>, ResumedMessages<Body, Resumed>>,
    FetchFinishListener<Body, Resume<Req>, ResumedMessages<Body, Resumed>>,
    AbortedListener<FormAborted, Resume<Req>, ResumedMessages<Body, Resumed>>,
    SavedListener<FormSaved, Resume<Req>, ResumedMessages<Body, Resumed>>,
    SuspendListener<Suspend, SuspendedMessages<Req>> {

    /**
     * beforeFetch hook.
     *
     * Use this hook to spawn any supporting actors and setup loading UI.
     */
    beforeFetch(r: Resume<Req>): Workflow<Req, Body, Resumed>

}

/**
 * AbstractWorkflow implementation.
 */
export abstract class AbstractWorkflow<Req, Body, Resumed>
    extends
    Mutable
    implements
    Workflow<Req, Body, Resumed> {

    /**
     * group if provided is the name of a group of actors to stop
     * each time the AbstractWorkflow suspends.
     *
     * Use it to kill supporting actors that are respawnend on each resume.
     */
    abstract group: Maybe<Group>;

    /**
     * prefetch is the address of the actor that does the initial fetching
     * of data.
     *
     * It should be spawned in the beforeFetch() hook.
     */
    abstract prefetch: Address;

    /**
     * contentLoading is the address of the actor that streams the initial
     * view while we load data.
     *
     * It should be spawned in the beforeFetch() hook.
     */
    abstract contentLoading: Address;

    /**
     * beforeFetch hook.
     *
     * Applied during the beforeResumed hook.
     */
    abstract beforeFetch(r: Resume<Req>): AbstractWorkflow<Req, Body, Resumed>;

    /**
     * beforeResumed sets up the tmp UI and initiates the fetch.
     */
    beforeResumed(r: Resume<Req>): AbstractWorkflow<Req, Body, Resumed> {

        this.beforeFetch(r);
        this.tell(this.contentLoading, new Stream());
        this.tell(this.prefetch, new Start());
        return this;

    }

    resumed(r: Resume<Req>): Case<ResumedMessages<Body, Resumed>>[] {

        return whenResumed(this, r);

    }

    /**
     * afterFetchFinishError handles the failed initial fetch.
     */
    abstract afterFetchFinishError(r: FetchFinishError)
        : AbstractWorkflow<Req, Body, Resumed>

    /**
     * afterFetchFinishOk handles the successful initial fetch.
     */
    abstract afterFetchFinishOk(r: FetchFinishOk<Body>)
        : AbstractWorkflow<Req, Body, Resumed>

    /**
     * afterFormAborted handles aborted form messages.
     */
    afterFormAborted(_: FormAborted): AbstractWorkflow<Req, Body, Resumed> {

        return this;

    }

    /**
     * afterFormSaved handles saved form messages.
     */
    afterFormSaved(_: FormSaved): AbstractWorkflow<Req, Body, Resumed> {

        return this;

    }

    /**
     * beforeSuspended kills supporting actors (if configured)
     * and acknowledges the request.
     */
    beforeSuspended(s: Suspend): AbstractWorkflow<Req, Body, Resumed> {

        if (this.group.isJust())
            this.kill(this.group.get());

        this.tell(s.router, new Ack());

        return this;

    }

    suspended(): Case<SuspendedMessages<Req>>[] {

        return whenSuspended(this);

    }

}

/**
 * whenSuspended
 *           resumed   suspended
 * suspended <Resume>  <Suspend>
 */
export const whenSuspended = <Req, Body, Resumed>
    (c: AbstractWorkflow<Req, Body, Resumed>)
    : Case<SuspendedMessages<Req>>[] => [

        new ResumeCase<Resume<Req>, ResumedMessages<Body, Resumed>>(Resume, c),

        new SuspendCase(Suspend, c)

    ];

/**
 * whenResumed
 *         loading  resumed           suspended
 * loading          <PreloadFinished>  
 * resumed                            <Suspend>
 * suspended
 */
export const whenResumed = <Req, Body, Resumed>
    (c: AbstractWorkflow<Req, Body, Resumed>, r: Resume<Req>)
    : Case<ResumedMessages<Body, Resumed>>[] =>
    <Case<ResumedMessages<Body, Resumed>>[]>[

        new FetchFinishErrorCase(r, c),

        new FetchFinishOkCase(r, c),

        new AbortedCase(FormAborted, r, c),

        new SavedCase(FormSaved, r, c),

        new SuspendCase<Suspend, SuspendedMessages<Req>>(Suspend, c),

    ];
