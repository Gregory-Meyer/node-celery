"use strict";

const EventEmitter = require('events').EventEmitter;
const redis = require('redis');
const uuidv4 = require('uuid/v4');
const amqp = require("amqplib/callback_api");
const lodash_shuffle = require("lodash.shuffle");

export class RabbitBroker extends EventEmitter {

    constructor(conf) {
        super();
        let self = this;
        self.ready = false;
        // shuffle connection urls to pick one to connect to
        self.shuffled_connection_urls = lodash_shuffle(conf.BROKER_URLS);
        self.makeConnection();
        this.redis_client.on('connect', this.onConnect);
        this.redis_client.on('error', this.onError);
        this.redis_client.on('end', this.onEnd);
    }

    makeConnection() {
        let self = this;
        for (let connection_url of this.shuffled_connection_urls) {
            amqp.connect(connection_url, {servername: url.parse(connection_url).hostname}, function(err, connection) {
                if(err) {
                    self.onError(err);
                } else {
                    self.amqp_client = connection;
                    self.onConnect();
                    self.amqp_client.on('close', function(err) {
                        self.onError(err);
                        self.makeConnection();
                    });
                    break;
                }
            })
        }
        self.emit('end');
    }

    // end() {
    //
    // }

    // disconnect() {
    //     this.ready = false;
    //
    // }

    onConnect() {
        this.ready = true;
        this.emit('ready');
    }

    onError(err) {
        this.emit('error', err);
    }


    publish(queue, message, options, callback, id) {

    }
}