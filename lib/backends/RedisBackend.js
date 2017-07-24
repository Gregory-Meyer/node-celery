"use strict";

const EventEmitter = require('events').EventEmitter;
const redis = require('redis');

export class RedisBackend extends EventEmitter {

    constructor(client_options, key_prefix, subscribe_to_results = false, task_result_durable = false, task_result_expiration = 1000) {
        super();
        let self = this;
        self.redis_client = redis.createClient(client_options);

        self.redis_client.on('error', self.onError);
        self.redis_client.on('end', self.onEnd);
        self.backend_type = 'redis';
        self.ready = false;

        self.results = {};
        self.key_prefix = key_prefix;

        self.subscribe_to_results = subscribe_to_results;
        if (self.subscribe_to_results) {
            /*
             When a client issues a SUBSCRIBE or PSUBSCRIBE, that connection is put into a "subscriber" mode.
             At that point, only commands that modify the subscription set are valid and quit
             (and depending on the redis version ping as well).
             When the subscription set is empty, the connection is put back into regular mode.

             If you need to send regular commands to Redis while in subscriber mode, which we do,
             just open another connection with a new client (hint: use client.duplicate()).

             Since we do subscribe to task results, we need to duplicate the client
             */
            self.redis_client_sub = self.redis_client.duplicate();
            self.redis_client_sub.on('error', self.onError);
            self.redis_client_sub.on('end', self.onEnd);


            self.redis_client_sub.on('connect', function () {
                self.redis_client_sub.on('pmessage', function (pattern, channel, data) {
                    if (task_result_durable) {
                        self.redis_client.expire(channel, task_result_expiration / 1000);
                    } else {
                        self.redis_client.expire(channel, 0);
                    }
                    let message = JSON.parse(data);
                    let taskid = channel.slice(key_prefix.length);
                    if (self.results.hasOwnProperty(taskid)) {
                        let res = self.results[taskid];
                        res.result = message;
                        res.emit('ready', res.result);
                        delete self.results[taskid];
                    } else {
                        // in case of incoming messages where we don't have the result object
                        self.emit('message', message);
                    }
                });
                // subscribe to redis results
                self.redis_client_sub.psubscribe(key_prefix + '*', () => {
                    self.ready = true;
                    self.emit('ready');
                });
            });
        } else {
            self.ready = true;
            self.emit('ready');
        }
    }

    onError(err) {
        this.emit('error', err);
    }

    onEnd() {
        this.ready = false;
        this.emit('end');
    }

    disconnect() {
        this.ready = false;
        this.redis_client.quit();

        if (this.subscribe_to_results) {
            this.redis_client_sub.quit();
        }
    }


    get(task_id, callback) {
        this.redis_client.get(this.key_prefix + task_id, callback);
    };

    del(task_id, callback) {
        this.redis_client.del(this.key_prefix + task_id, callback);
    };

}