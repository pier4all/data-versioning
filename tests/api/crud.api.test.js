'use strict'

const tap = require('tap')
const build = require('../../src/app')
var chalk = require('chalk');
var d = require('../fixtures/db_seed')

const Customer = require("../../src/models/customer");

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

// start in memory server: Use the version 6.9.5
const { MongoMemoryReplSet } = require( 'mongodb-memory-server' );

const replSet = new MongoMemoryReplSet({
    replSet: { storageEngine: 'wiredTiger' }
});

tap.test('init the db', async t => {

    // start
    await replSet.waitUntilRunning()
    const mongoUri = await replSet.getUri()

    const mongooseOpts = {
        useUnifiedTopology: true, 
        useNewUrlParser: true, 
        useFindAndModify: false
    };

    await mongoose.connect(mongoUri, mongooseOpts);
    console.log(chalk.bold.green(`mongoose successfully connected to ${mongoUri}`));
    t.end()

})

tap.test('requests the "/crud" route', async t => {
    const app = build()
  
    const response = await app.inject({
      method: 'GET',
      url: '/crud'
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
})

tap.test('create customer 1', async t => {
    const app = build()
    const response = await app.inject({
        method: 'POST',
        url: '/crud/customer',
        body: d.customerOne
    })
    t.equal(response.statusCode, 201, 'returns a status code of 200')
}) 

tap.test('create customer 2', async t => {
    const app = build()
    const response = await app.inject({
        method: 'POST',
        url: '/crud/customer',
        body: d.customerTwo
    })
    t.equal(response.statusCode, 201, 'returns a status code of 200')
}) 

tap.test('requests all the customers', async t => {
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: '/crud/customer/all'
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
    t.equal(2, JSON.parse(response.body).length)
})


tap.test('edit customer', async t => {
    const app = build()
    const changes = { "language": "DE" }
    const response = await app.inject({
        method: 'PATCH',
        url: `/crud/customer/${d.customerOne._id}/1`,
        body: changes
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
    console.log(response.body)
}) 

tap.test('requests old version customer data', async t => {
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: `/crud/customer/${d.customerOne._id}`
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
    t.equal(2, JSON.parse(response.body)._version)
})

tap.test('requests current customer data', async t => {
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: `/crud/customer/${d.customerOne._id}/1`
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
    t.equal(1, JSON.parse(response.body)._version)
})


tap.test('delete customer', async t => {
    const app = build()
    const response = await app.inject({
        method: 'DELETE',
        url: `/crud/customer/${d.customerOne._id}`
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
    console.log(response.body)
}) 

tap.teardown(async function() { 
    mongoose.disconnect();
    await replSet.stop();
    console.log(chalk.bold.red('MongoDB disconnected'));
});