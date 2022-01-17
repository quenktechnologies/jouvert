"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifiedAllForOneStrategy = exports.AllForOneStrategy = exports.OneForOneStrategy = exports.NoStrategy = void 0;
/**
 * NoStrategy simply sets the captured values on the ValidatorFormScene.
 *
 * This is useful if all validation is done on the server side.
 */
class NoStrategy {
    constructor(form) {
        this.form = form;
    }
    validate({ name, value }) {
        this.form.set(name, value);
    }
}
exports.NoStrategy = NoStrategy;
/**
 * OneForOneStrategy validates event input and triggers the respect
 * onField(In)?Valid callback.
 */
class OneForOneStrategy {
    constructor(form, validator) {
        this.form = form;
        this.validator = validator;
    }
    validate({ name, value }) {
        let { form, validator } = this;
        let eResult = validator.validate(name, value);
        if (eResult.isLeft()) {
            form.onFieldInvalid(name, value, eResult.takeLeft());
        }
        else {
            let value = eResult.takeRight();
            form.set(name, value);
            form.onFieldValid(name, value);
        }
    }
}
exports.OneForOneStrategy = OneForOneStrategy;
/**
 * AllForOneStrategy validtes InputEvent input and invokes the
 * respective callbacks.
 *
 * Callbacks for the entire form are also invoked.
 */
class AllForOneStrategy {
    constructor(form, validator) {
        this.form = form;
        this.validator = validator;
    }
    getValues() {
        return this.form.getValues();
    }
    validate({ name, value }) {
        let { form, validator } = this;
        let eResult = validator.validate(name, value);
        if (eResult.isLeft()) {
            form.onFieldInvalid(name, value, eResult.takeLeft());
            form.onFormInvalid();
        }
        else {
            let value = eResult.takeRight();
            form.set(name, value);
            form.onFieldValid(name, value);
            let eAllResult = validator.validateAll(this.getValues());
            if (eAllResult.isRight())
                form.onFormValid();
            else
                form.onFormInvalid();
        }
    }
}
exports.AllForOneStrategy = AllForOneStrategy;
/**
 * ModifiedAllForOneStrategy is similar to AllForOneStrategy but only considers
 * the values that have been modified when validating the entire form.
 */
class ModifiedAllForOneStrategy extends AllForOneStrategy {
    getValues() {
        return this.form.getModifiedValues();
    }
}
exports.ModifiedAllForOneStrategy = ModifiedAllForOneStrategy;
//# sourceMappingURL=strategy.js.map