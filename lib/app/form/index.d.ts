import { Value } from '@quenk/noni/lib/data/jsonx';
/**
 * FieldName
 */
export declare type FieldName = string;
/**
 * FieldValue
 */
export declare type FieldValue = Value;
/**
 * FieldError
 */
export declare type FieldError = string;
/**
 * FormErrors map.
 */
export interface FormErrors {
    [key: string]: FieldError;
}
