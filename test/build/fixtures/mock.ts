
export class Invoke {

    constructor(public name: string, public args: any[]) { }

}

export class Mock {

    constructor(methods: { [key: string]: any } = {}) {

        Object
            .keys(methods)
            .forEach(k => this.__record(k, methods[k] === self ? this : methods[k]));

    }

    __test = {

        data: {

            invokes: <Invoke[]>[]

        },

        invokes: {

            order: () => this.__test.data.invokes.map(c => c.name)

        }

    }

    __method = (name: string, ret: any) => {

        Object.defineProperty(this, name, {

            value: function() {

                this.__record(name, Array.prototype.slice.call(arguments));
                return ret;

            }

        });

    }

    __record = (name: string, args: any) => {

        this.__test.data.invokes.push(new Invoke(name, args));
        return this;

    }

}
