"use strict";

const EventEmitter = require('events').EventEmitter;
const redis = require('redis');
const uuidv4 = require('uuid/v4');

export class RedisBroker extends EventEmitter {

    constructor(conf) {
        super();
        this.ready = false;
        this.redis_client = redis.createClient(conf.BROKER_OPTIONS);
        this.redis_client.on('connect', this.onConnect);
        this.redis_client.on('error', this.onError);
        this.redis_client.on('end', this.onEnd);

    }

    end() {
        this.redis_client.end(true);
    }

    disconnect() {
        this.ready = false;
        this.redis_client.quit();
    }

    onConnect() {
        this.ready = true;
        this.emit('ready');
    }

    onError(err) {
        this.emit('error', err);
    }

    onEnd() {
        this.ready = false;
        this.emit('end');
    }

    publish(queue, message, options, callback, id) {
        let payload = {
            body: new Buffer(message).toString('base64'),
            headers: {},
            'content-type': options.contentType,
            'content-encoding': options.contentEncoding,
            properties: {
                body_encoding: 'base64',
                correlation_id: id,
                delivery_info: {
                    exchange: queue,
                    priority: 0,
                    routing_key: queue
                },
                delivery_mode: 2,
                delivery_tag: uuidv4(),
                reply_to: uuidv4()
            }
        };
        this.redis_client.lpush(queue, JSON.stringify(payload), callback);
    }
}