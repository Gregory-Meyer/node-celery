"use strict";

const EventEmitter = require('events').EventEmitter;
const async = require('async');

import {Configuration} from "Configuration";
import {RedisBackend} from "backends/RedisBackend";
// import { RabbitBackend } from 'backends/RabbitBackend';
import {RabbitBroker} from "brokers/RabbitBroker";
import {RedisBroker} from "brokers/RedisBroker";
import {Task} from "Task";

export class Client extends EventEmitter {

    constructor(conf) {
        super();
        let self = this;
        self.ready = false;
        self.conf = new Configuration(conf);

        async.parallel([
            function backendConnection(parallelCallback) {
                if (self.conf.backend_type === 'redis') {
                    self.backend = new RedisBackend(self.conf.RESULT_BACKEND_OPTIONS, self.conf.TASK_RESULT_PREFIX, self.conf.SUBSCRIBE_TO_RESULTS, self.conf.TASK_RESULT_DURABLE, self.conf.TASK_RESULT_EXPIRES);
                    self.backend.on('message', function (msg) {
                        self.emit('message', msg);
                    });
                } else if (self.conf.backend_type === 'amqp') {
                    self.backend = amqp.createConnection(self.conf.RESULT_BACKEND_OPTIONS, {
                        defaultExchangeName: self.conf.DEFAULT_EXCHANGE
                    });
                }

                self.backend.on('error', function (err) {
                    self.emit('error', err);
                });

                self.backend.once('ready', function () {
                    self.backend.on('ready', function () {
                        self.backend.ready = true;
                        if (self.broker.ready) {
                            self.emit('connect')
                        }
                    });
                    parallelCallback(null);
                })

            }, function brokerConnection(parallelCallback) {
                if (self.conf.broker_type === 'redis') {
                    self.broker = new RedisBroker(self.conf);
                } else if (self.conf.broker_type === 'amqp') {
                    debug('Connecting to amqp broker');
                    self.broker = RabbitBroker(self.conf);
                }

                self.broker.on('error', function (err) {
                    self.emit('error', err);
                });

                self.broker.on('end', function () {
                    self.emit('end');
                    debug('Broker connection end...');
                });

                self.broker.once('ready', function () {
                    debug('Broker connected...');
                    self.brokerReady = true;
                    self.broker.on('ready', function () {
                        if (self.backend.ready) {
                            self.emit('connect');
                        }
                    });
                    parallelCallback(null);
                });
            }
        ], function (err) {
            self.ready = true;
            self.emit('connect');
        });
    }

    createTask(name, options, exchange) {
        return new Task(name, this, options, exchange);
    }

    end() {
        this.broker.disconnect();
        this.backend.disconnect();
    }
}