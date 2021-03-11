const tape = require('tape');

const customerController = require('../src/controllers/customer.controller');

var Mongoose = require('mongoose').Mongoose;
var mongoose = new Mongoose();
 
var Mockgoose = require('mockgoose').Mockgoose;
var mockgoose = new Mockgoose(mongoose);

tape.onFinish(function() { 
    process.exit() 
});

tape('connect', function (t) {
    return mockgoose.prepareStorage()
        .then(function () {
            mongoose.connect('mongodb://foobar/baz');
            mongoose.connection.on('connected', () => {  
                t.comment('*** db connection is now open ***');
            })}).then(function () {
                return t.test('test returns true', function (t) {
                    t.ok(true, "OK");
                    t.end();
            });
    })
});