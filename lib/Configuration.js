const url = require('url');
const util = require('util');
const supportedProtocols = ['amqp', 'redis'];

function getProtocol(kind, options) {
    let proto_url = options.url;
    if(Array.isArray(url)) {
        proto_url = url[0];
    }
    let protocol = url.parse(proto_url).protocol.slice(0, -1);
    if (protocol === 'amqps') {
        protocol = 'amqp';
    }
    if (supportedProtocols.indexOf(protocol) === -1) {
        throw new Error(util.format('Unsupported %s type: %s', kind, protocol));
    }

    return protocol;
}

function addProtocolDefaults(protocol, options) {
    if (protocol === 'amqp') {
        options.heartbeat = options.heartbeat || 580;
    }
}


export class Configuration {
    
    constructor(options) {
        for (let o in options) {
            if (options.hasOwnProperty(o)) {
                this[o.replace(/^CELERY_/, '')] = options[o];
            }
        }
        
        this.TASK_RESULT_EXPIRES = this.TASK_RESULT_EXPIRES * 1000 || 86400000; // Default 1 day
        // broker
        this.BROKER_OPTIONS = this.BROKER_OPTIONS || {};
        this.BROKER_URLS = this.BROKER_URL || [ 'amqp://' ];
        this.BROKER_OPTIONS.url = this.BROKER_URLS;
        this.broker_type = getProtocol('broker', this.BROKER_OPTIONS);
        addProtocolDefaults(this.broker_type, this.BROKER_OPTIONS);
    
        // backend
        this.RESULT_BACKEND_OPTIONS = this.RESULT_BACKEND_OPTIONS || {};
        if (this.RESULT_BACKEND === this.broker_type) {
            this.RESULT_BACKEND = this.BROKER_URL;
        }
        this.RESULT_BACKEND_OPTIONS.url = this.RESULT_BACKEND || this.BROKER_URL;
        this.backend_type = getProtocol('backend', this.RESULT_BACKEND_OPTIONS);
        addProtocolDefaults(this.backend_type, this.RESULT_BACKEND_OPTIONS);
    
        this.DEFAULT_QUEUE = this.DEFAULT_QUEUE || 'celery';
        this.DEFAULT_EXCHANGE = this.DEFAULT_EXCHANGE || '';
        this.DEFAULT_EXCHANGE_TYPE = this.DEFAULT_EXCHANGE_TYPE || 'direct';
        this.DEFAULT_ROUTING_KEY = this.DEFAULT_ROUTING_KEY || 'celery';
        this.RESULT_EXCHANGE = this.RESULT_EXCHANGE || 'celeryresults';
        this.IGNORE_RESULT = this.IGNORE_RESULT || false;
        this.TASK_RESULT_DURABLE = undefined !== this.TASK_RESULT_DURABLE ? this.TASK_RESULT_DURABLE : true; // Set Durable true by default (Celery 3.1.7)
        this.ROUTES = this.ROUTES || {};

        this.TASK_RESULT_PREFIX = options.TASK_RESULT_PREFIX || 'celery-task-meta-';
        this.SUBSCRIBE_TO_RESULTS = options.SUBSCRIBE_TO_RESULTS || false;
    }
}