"use strict";

const uuidv4 = require('uuid/v4');

const fields = [
    'task', 'id', 'args', 'kwargs', 'retries', 'eta', 'expires', 'queue', 'taskset', 'chord', 'utc', 'callbacks', 'errbacks', 'timeouts', 'priority'
];


function formatDate(date) {
    return new Date(date).toISOString();
}

export class Message {
    constructor(task_name, args = [], kwargs = {}, options = {}, id = uuidv4()) {
        let self = this;
        if (args === null) {
            args = [];
        }
        if (kwargs === null) {
            kwargs = {};
        }
        if (options === null) {
            options = {};
        }
        self.message = {
            task: task_name,
            args: args,
            kwargs: kwargs,
            id: id
        };

        for (let o in options) {
            if (options.hasOwnProperty(o)) {
                if (fields.indexOf(o) === -1) {
                    throw "invalid option: " + o;
                }
                self.message[o] = options[o];
            }
        }

        if (self.message.eta) {
            self.message.eta = formatDate(self.message.eta);
        }

        if (self.message.expires) {
            self.message.expires = formatDate(self.message.expires);
        }
    }

    toJSONString(){
        return JSON.stringify(this.message);
    }

    get() {
        return this.message;
    }
}
