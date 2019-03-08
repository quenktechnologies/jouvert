import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../actor';

/**
 * BeforeResumes indicates the actor has a hook that can be invoked
 * before resuming.
 */
export interface BeforeResumes<T> {

    /**
     * beforeResume hook.
     */
    beforeResume(r: T): BeforeResumes<T>

}

/**
 * Resumes indicates the actor has a behaviour for being resumed.
 *
 * This is usually the state where the actor is given control of the app.
 */
export interface Resumes<T, M> extends Actor {

    /**
     * resume cases provider.
     */
    resume(r: T): Case<M>[]

}
