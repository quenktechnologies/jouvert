import {Value} from '@quenk/noni/lib/data/jsonx';

/**
 * FieldName
 */
export type FieldName = string;

/**
 * FieldValue
 */
export type FieldValue = Value;

/**
 * FieldError
 */
export type FieldError = string;

/**
 * FormErrors map.
 */
export interface FormErrors {

    [key: string]: FieldError

}
