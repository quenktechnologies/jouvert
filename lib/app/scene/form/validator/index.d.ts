import { Object } from '@quenk/noni/lib/data/jsonx';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { FieldName, FieldValue, FieldError, FormScene, FormSceneMessage, BaseFormScene } from '../';
import { ValidationStrategy } from './strategy';
import { InputEvent, SaveFailed } from '../';
/**
 * ValidatorFormScene is the interface implemented by actors serving as the
 * "controller" for HTML form views with validation.
 *
 * ValidatorFormScene differs from a regular [[FormScene]] by including client
 * side validation in its design. As values are collected from the user, they
 * can be validated and the feedback state of the form updated before being set.
 *
 * This allows for a more dynamic user experience when desirable.
 */
export interface ValidatorFormScene<T extends Object> extends FormScene<T> {
    /**
     * strategy used for validation.
     *
     * This determines how data is validated and the callbacks to apply.
     */
    strategy: ValidationStrategy;
}
/**
 * FieldStateListener indicates an ValidatorFormScene has methods for reacting
 * to the result of a single field's validation.
 *
 * Use to implement visual feedback to the user.
 */
export interface FieldStateListener<T extends Object> extends ValidatorFormScene<T> {
    /**
     * onFieldInvalid is applied when a field becomes invalid.
     */
    onFieldInvalid(name: FieldName, value: FieldValue, error: FieldError): void;
    /**
     * onFieldValid is applied when a field becomes valid.
     */
    onFieldValid(name: FieldName, value: FieldValue): void;
}
/**
 * FormStateListener indicates an ValidatorFormScene has methods for reacting to
 * the result of the entire form's validation.
 *
 * Use to provide the user with visual feedback such as enabling the save button.
 */
export interface FormStateListener<T extends Object> extends FieldStateListener<T> {
    /**
     * onFormInvalid is applied when the entire form becomes invalid.
     */
    onFormInvalid(): void;
    /**
     * onFormValid is applied when the entire form becomes valid.
     */
    onFormValid(): void;
}
/**
 * InputEventCase validates the value provided in the InputEvent when
 * matched.
 */
export declare class InputEventCase<T extends Object> extends Case<InputEvent> {
    form: ValidatorFormScene<T>;
    constructor(form: ValidatorFormScene<T>);
}
/**
 * BaseValidatorFormScene is an abstract extension to the BaseFormScene
 * class to add validation and feedback features.
 */
export declare abstract class BaseValidatorFormScene<T extends Object, M> extends BaseFormScene<T, M> implements FormStateListener<T> {
    strategy: ValidationStrategy;
    receive(): Case<FormSceneMessage<M>>[];
    onSaveFailed(_: SaveFailed): void;
    onFieldInvalid(): void;
    onFieldValid(): void;
    onFormInvalid(): void;
    onFormValid(): void;
}
