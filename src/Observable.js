const EventEmitter = require('events');

class Observable extends EventEmitter {
    static EVENT = 'set';
    #value = 0;

    constructor(initialValue) {
        super();
        this.#value = initialValue;
    }

    get value() {
        return this.#value;
    }

    set value(newValue) {
        this.#value = newValue;
        this.emit(Observable.EVENT, newValue);
    }
}

exports.Observable = Observable;
