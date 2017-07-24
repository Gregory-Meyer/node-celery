"use strict";

const uuidv4 = require('uuid/v4');
import { Message } from 'Message';
import { Result } from 'Result';

export class Task {

    constructor(name, client, task_id = uuidv4(), options, exchange) {
        this.name = name;
        this.client = client;
        this.id = task_id;
        this.options = options;
        this.result = null;
        this.exchange = exchange;

        this.route = self.client.conf.ROUTES[name];
        this.queue = this.route && this.route.queue;
    }


    _publish(args, kwargs, options, callback) {
        let queue = options.queue || this.options.queue || this.queue || this.client.conf.DEFAULT_QUEUE;
        this.result = new Result(this.id, self.client);

        if(this.client.backend_type === 'redis') {
            this.client.backend.results[this.result.task_id] = this.result;
        }

        let message = new Message(name, args, kwargs, options);
        let pubOptions = {
            'contentType': 'application/json',
            'contentEncoding': 'utf-8'
        };
        //add priority to pubOptions if passed
        if (options.priority !== null && options.priority !== 0) {
            pubOptions.priority = options.priority;
        }

        if(this.exchange) {
            this.exchange.publish(queue, message.toJSONString(), pubOptions, callback);
        } else {
            this.client.broker.publish(queue, message.toJSONString(), pubOptions, callback);
        }
    }

    call(args, kwargs, options, callback) {
        args = args || [];
        kwargs = kwargs || {};
        options = options || this.options || {};

        if (!this.client.ready) {
            self.client.emit('error', 'Client is not ready');
        } else {
            return this._publish(args, kwargs, options, callback);
        }
    }

}


