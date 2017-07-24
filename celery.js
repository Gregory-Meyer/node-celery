"use strict";

import { Configuration } from 'lib/Configuration';
import { Client } from 'lib/Client';
import { Result } from 'lib/Result';


exports.createClient = function(config) {
    let conf = new Configuration(config);
    return new Client(conf);
};

exports.createResult = function(taskId, client) {
    return new Result(taskId, client);
};