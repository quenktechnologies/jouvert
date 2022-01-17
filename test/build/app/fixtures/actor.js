"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericImmutable = void 0;
const actor_1 = require("../../../../lib/actor");
/**
 * GenericImmutable is an Immutable that accepts its cases in the constructor.
 */
class GenericImmutable extends actor_1.Immutable {
    constructor(system, cases, runFunc) {
        super(system);
        this.system = system;
        this.cases = cases;
        this.runFunc = runFunc;
    }
    receive() {
        return this.cases;
    }
    run() {
        this.runFunc(this);
    }
}
exports.GenericImmutable = GenericImmutable;
//# sourceMappingURL=actor.js.map