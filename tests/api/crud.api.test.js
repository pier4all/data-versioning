'use strict'

const tap = require('tap')
const build = require('../../src/app')
const chalk = require('chalk')
const db_seed = require('../fixtures/db_seed')

const Customer = require("../../src/models/customer")

const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')

// start in memory server: Use the version 6.9.5
const { MongoMemoryReplSet } = require( 'mongodb-memory-server' )

const replSet = new MongoMemoryReplSet({
    replSet: { storageEngine: 'wiredTiger' }
})

tap.test('init the db', async t => {
    // start
    await replSet.waitUntilRunning()
    const mongoUri = await replSet.getUri()

    const mongooseOpts = {
        useUnifiedTopology: true, 
        useNewUrlParser: true, 
        useFindAndModify: false
    }

    await mongoose.connect(mongoUri, mongooseOpts)
    console.log(chalk.bold.green(`mongoose successfully connected to ${mongoUri}`))
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
        body: db_seed.customerOne
    })
    t.equal(response.statusCode, 201, 'returns a status code of 200')
    // t.equal(1, JSON.parse(response.body)._version)
}) 

tap.test('create customer 2', async t => {
    const app = build()
    const response = await app.inject({
        method: 'POST',
        url: '/crud/customer',
        body: db_seed.customerTwo
    })
    t.equal(response.statusCode, 201, 'returns a status code of 201')
    // t.equal(1, JSON.parse(response.body)._version)
}) 

tap.test('create duplicated customer 2', async t => {
    const app = build()
    const response = await app.inject({
        method: 'POST',
        url: '/crud/customer',
        body: db_seed.customerTwo
    })
    t.equal(response.statusCode, 400, 'returns a status code of 400')
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

tap.test('requests all on a unexistent collection', async t => {
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: '/crud/wrong/all'
    })
    t.equal(response.statusCode, 400, 'returns a status code of 400')
})

tap.test('edit customer', async t => {
    const app = build()
    const changes = { "language": "DE", "_version": 7 }
    const response = await app.inject({
        method: 'PATCH',
        url: `/crud/customer/${db_seed.customerOne._id}/1`,
        body: changes
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
    // t.equal(2, JSON.parse(response.body)._version)
}) 

tap.test('bad edit customer with no data', async t => {
    const app = build()
    const changes = { }
    const response = await app.inject({
        method: 'PATCH',
        url: `/crud/customer/${db_seed.customerOne._id}/2`
    })
    t.equal(response.statusCode, 400, 'returns a status code of 400')
}) 

tap.test('bad edit customer with invalid version', async t => {
    const app = build()
    const changes = { }
    const response = await app.inject({
        method: 'PATCH',
        url: `/crud/customer/${db_seed.customerOne._id}/two`
    })
    t.equal(response.statusCode, 400, 'returns a status code of 400')
}) 

tap.test('requests current version customer data', async t => {
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: `/crud/customer/${db_seed.customerOne._id}`
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
    // t.equal(2, JSON.parse(response.body)._version)
})

tap.test('requests wrong format version customer data', async t => {
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: `/crud/customer/${db_seed.customerOne._id}/one`
    })
    t.equal(response.statusCode, 400, 'fails with status code of 400')
})

tap.test('requests to update unexistent customer data', async t => {
    const app = build()

    const response = await app.inject({
        method: 'PATCH',
        url: `/crud/customer/${db_seed.customerThree._id}/1`,
        body: {}
    })
    t.equal(response.statusCode, 404, 'fails with status code of 404')
})

tap.test('requests to update customer data wrong format version ', async t => {
    const app = build()

    const response = await app.inject({
        method: 'PATCH',
        url: `/crud/customer/${db_seed.customerThree._id}/bad`,
        body: {}
    })
    t.equal(response.statusCode, 400, 'fails with status code of 400')
})

tap.test('requests old customer data', async t => {
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: `/crud/customer/${db_seed.customerOne._id}/1`
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
    // t.equal(1, JSON.parse(response.body)._version)
})

// tap.test('requests non existing version of customer data', async t => {
//     const app = build()

//     const response = await app.inject({
//         method: 'GET',
//         url: `/crud/customer/${db_seed.customerOne._id}/10`
//     })
//     t.equal(response.statusCode, 404, 'fails with status code of 404')
// })

tap.test('delete customer', async t => {
    const app = build()
    await wait(1000) // sleep a bit before deleting
    const response = await app.inject({
        method: 'DELETE',
        url: `/crud/customer/${db_seed.customerOne._id}/2`
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
    console.log(response.body)
}) 

tap.test('requests non-existent collection data', async t => {
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: `/crud/wrong/${db_seed.customerOne._id}/1`
    })
    t.equal(response.statusCode, 400, 'fails with status code of 400')
})

tap.teardown(async function() { 
    mongoose.disconnect()
    await replSet.stop()
    console.log(chalk.bold.red('MongoDB disconnected'))
})

export const wait = (t) => new Promise(res => setTimeout(res, t))
