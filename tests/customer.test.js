'use strict'

const tap = require('tap')
const build = require('../src/app')
var chalk = require('chalk');

const Customer = require("../src/models/customer");

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

// start in memory server
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongoServer = new MongoMemoryServer();

mongoServer.getUri().then((mongoUri) => {
  const mongooseOpts = {
    useUnifiedTopology: true, 
    useNewUrlParser: true, 
    useFindAndModify: false
  };

  mongoose.connect(mongoUri, mongooseOpts);

  mongoose.connection.on('error', (e) => {
    if (e.message.code === 'ETIMEDOUT') {
      console.log(e);
      mongoose.connect(mongoUri, mongooseOpts);
    }
    console.log(e);
  });

  mongoose.connection.once('open', () => {
    console.log(chalk.bold.green(`MongoDB successfully connected to ${mongoUri}`));
  });
});

const customerOne = { 
    _id: new mongoose.Types.ObjectId(),
    "name": "Billa AG",
    "email": "info@billa.ch",
    "language": "FR"
  }

  const customerTwo = { 
    _id: new mongoose.Types.ObjectId(),
    "name": "LuaBox AG",
    "email": "luabox@etsy.es",
    "language": "ES"
  }

tap.test('requests all the customers', async t => {
  const app = build()

  var customer1 = await new Customer(customerOne).save()
  var customer2 = await new Customer(customerTwo).save()

  const response = await app.inject({
    method: 'GET',
    url: '/customers/all'
  })
  t.strictEqual(response.statusCode, 200, 'returns a status code of 200')
  t.equal(2, JSON.parse(response.body).length)
})

tap.test('requests one customer', async t => {
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: `/customers/${customerOne._id}`
    })
    t.strictEqual(response.statusCode, 200, 'returns a status code of 200')
    console.log(response.body)
})

tap.teardown(async function() { 
  mongoose.disconnect();
  mongoServer.stop();
  console.log(chalk.bold.red('MongoDB disconnected'));
});