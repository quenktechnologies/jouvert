"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseValidatorFormScene = exports.InputEventCase = void 0;
const type_1 = require("@quenk/noni/lib/data/type");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const __1 = require("../");
const strategy_1 = require("./strategy");
/**
 * InputEventCase validates the value provided in the InputEvent when
 * matched.
 */
class InputEventCase extends case_1.Case {
    constructor(form) {
        super({ name: String, value: type_1.Any }, (e) => {
            return form.strategy.validate(e);
        });
        this.form = form;
    }
}
exports.InputEventCase = InputEventCase;
/**
 * BaseValidatorFormScene is an abstract extension to the BaseFormScene
 * class to add validation and feedback features.
 */
class BaseValidatorFormScene extends __1.BaseFormScene {
    constructor() {
        super(...arguments);
        this.strategy = new strategy_1.NoStrategy(this);
    }
    receive() {
        return [
            new InputEventCase(this),
            ...super.receive()
        ];
    }
    onFieldInvalid() { }
    onFieldValid() { }
    onFormInvalid() { }
    onFormValid() { }
}
exports.BaseValidatorFormScene = BaseValidatorFormScene;
//# sourceMappingURL=index.js.map