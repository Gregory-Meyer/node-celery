"use strict";

const EventEmitter = require('events').EventEmitter;


export class Result extends EventEmitter {

    constructor(task_id, client, ignore_result = true) {
        super();

        this.task_id = task_id;
        this.client = client;
        this.result = null;

        if (this.client.backend_type === 'amqp' && !ignore_result) {
            this.client.backend.queue(
                this.task_id.replace(/-/g, ''), {
                    "arguments": {
                        'x-expires': self.client.conf.TASK_RESULT_EXPIRES
                    },
                    'durable': self.client.conf.TASK_RESULT_DURABLE,
                    'closeChannelOnUnsubscribe': true
                },

                function (queue) {
                    queue.bind(self.client.conf.RESULT_EXCHANGE, '#');
                    let ctag;
                    queue.subscribe(function (message) {
                        if (message.contentType === 'application/x-python-serialize') {
                            console.error('Celery should be configured with json serializer');
                            self.emit('error', 'Celery should be configured with json serializer');
                        } else {
                            self.result = message;
                            queue.unsubscribe(ctag);
                            self.emit('ready', message);
                            self.emit(message.status.toLowerCase(), message);
                        }
                    }).addCallback(function (ok) {
                        ctag = ok.consumerTag;
                    });
                }
            );
        }
    }

    get(callback) {
        if (callback && this.result === null) {
            this.client.backend.get(this.task_id, function (err, reply) {
                if (err) {
                    callback(err);
                } else {
                    try{
                        this.result = JSON.parse(reply);
                    } catch(err) {
                        callback(err);
                    }
                    callback(null, self.result);
                }
            });
        } else {
            if (callback) {
                callback(null, self.result);
            }
            return self.result;
        }
    }

    del(callback) {
        if (callback && this.result === null) {
            self.client.backend.del(this.task_id, function (err, reply) {
                if (err) {
                    callback(err);
                } else {
                    try {
                        self.result = JSON.parse(reply);
                    } catch (err) {
                        debug('Could not parse reply JSON from backend');
                        callback(err);
                    }
                }

                callback(null, self.result);
            });
        } else {
            if (callback) {
                callback(self.result);
            }
            return self.result;
        }
    }
}
