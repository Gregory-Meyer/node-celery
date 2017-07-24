let assert = require('assert');

import { Message } from '../../lib/Message';


describe('Message', function() {
    describe('constructor', function() {
        it('should create a message with default args', function() {
            let msg = new Message("foo", undefined, undefined, undefined, "id");
            assert.deepEqual(msg.get(), {
                task: "foo",
                args: [],
                kwargs: {},
                id: "id"
            });
        });

        it('should create a message with the given args', function() {
            let msg = new Message("foo", [1, 2], undefined, undefined, "id");
            assert.deepEqual(msg.get(), {
                task: "foo",
                args: [1, 2],
                kwargs: {},
                id: "id"
            });
            msg = new Message("foo", null, {
                bar: 3
            }, null, "id");
            assert.deepEqual(msg.get(), {
                task: "foo",
                args: [],
                kwargs: {
                    bar: 3
                },
                id: "id"
            });
            msg = new Message("foo", null, null, null, "bar");
            assert.deepEqual(msg.get(), {
                task: "foo",
                args: [],
                kwargs: {},
                id: "bar"
            });
        });

        it('should send the expiry as UTC', function() {
            let msg = new Message("foo", null, null, {
                expires: Date.parse('Mon Nov 30 2015 10:03:37 GMT+0000 (UTC)')
            }, "id");
            assert.deepEqual(msg.get(), {
                task: "foo",
                args: [],
                kwargs: {},
                expires: "2015-11-30T10:03:37.000Z",
                id: "id"
            });
        });
    });
});
