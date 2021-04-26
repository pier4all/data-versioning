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

    await d.initDB(build());

})

tap.test('requests the "/query" route', async t => {
    const app = build()
  
    const response = await app.inject({
      method: 'GET',
      url: '/crud'
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
})

tap.test('requests all the customers', async t => {
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: '/query/customer/find'
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
    t.equal(4, JSON.parse(response.body).length)
})

tap.test('requests 2 customers in custno descending order', async t => {
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: '/query/customer/find?limit=2&sort="custno":-1&projection="custno":1',
    })

    t.equal(response.statusCode, 200, 'returns a status code of 200')
    const customers = JSON.parse(response.body)
    t.equal(2, customers.length)
    t.equal(d.customerFour.custno, customers[0]['custno'])
    t.not(d.customerFour.email, customers[0]['email'])
})

tap.test('filter customers by language and sort by email in ascending order', async t => {
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: '/query/customer/find?query="language": "DE"&sort="email":1',
    })

    t.equal(response.statusCode, 200, 'returns a status code of 200')
    const customers = JSON.parse(response.body)
    t.equal(2, customers.length)
    t.equal(d.customerFour.custno, customers[0]['custno'])
})

tap.teardown(async function() { 
    mongoose.disconnect();
    await replSet.stop();
    console.log(chalk.bold.red('MongoDB disconnected'));
});