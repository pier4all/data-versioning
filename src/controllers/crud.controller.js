
const util = require('../versioning/util')
const c = require('../versioning/constants')
var chalk = require('chalk');
mongoose = require('mongoose')

const { processError } = require('./error')

const fs = require('fs');
var path = require('path');
const NS_PER_SEC = 1e9;

// output path
var report_file = 'time_report_' + new Date().toISOString().replace('T', '_').replace(/:/g, '-').split('.')[0] + '.csv'
var report = path.join(__dirname, '..', '..', 'output', report_file)
const sep = '\t'

exports.create = async (req, res) => {

  console.log(chalk.cyan("crud.controller.create: called create"))

  var collection = undefined

  try {
    
    // Get the collection
    collection = req.params.collection;
    const Model = require(`../models/${collection}`);

    // Create an Model
    const document = new Model(req.body);

    var bytesize = Buffer.from(JSON.stringify(document)).length

    // Save Customer in the database
    var start = process.hrtime();
    
    await document.save()

    // log timer (milliseconds)
    var diff = process.hrtime(start);
    var time = `${(diff[0] * NS_PER_SEC + diff[1])/1e6}`
    fs.appendFileSync(report, ['INSERT', collection, document._version, new Date().toISOString(), bytesize, time].join(sep) + '\n')

    res.status(201).send(document);

  } catch (error) {
    const message = `Error creating a document in the collection ${collection}.`
    processError(res, error, message)
  };
}

exports.update = async (req, res) => {

  let session
  let id
  let collection
  
  try {
    console.log(chalk.cyan("crud.controller.update: called update"))

    // Get the collection
    collection = req.params.collection;
    const Model = require(`../models/${collection}`);

    // Validate request
    if (!req.body) {
      return res.status(400).send({ message: "Data to update can not be empty" });
    }

    // Get the id
    id = req.params.id;
    
    // Update Customer in the database
    let document = await Model.findById(id)

    if (!document) res.status(404).send({ message: "Not found document with id " + id });
    else {
      // TODO: review this with Jean-Claude 
      // probably the whole object should be provided in the body including
      // the version number of the existing document to update.
      for (var key in req.body) {
          if (req.body.hasOwnProperty(key)) {
            document[key] = req.body[key]
          }
      }

      var bytesize = Buffer.from(JSON.stringify(document)).length

      // start timer
      var start = process.hrtime();

      // start transaction
      session = await mongoose.startSession();
      session.startTransaction();

      // store _session in document
      document[c.SESSION] = session

      await document.save({session})   

      // commit transaction
      await session.commitTransaction();

      // log timer
      var diff = process.hrtime(start);
      var time = `${(diff[0] * NS_PER_SEC + diff[1])/1e6}`
      fs.appendFileSync(report, ['UPDATE', collection, document._version, new Date().toISOString(), bytesize, time].join(sep) + '\n')

      session.endSession();
      console.log(chalk.greenBright("-- commit transaction --"))

      // return result
      res.status(200).send(document);
      // TODO consider alternative status 204 with no data
    }
  } catch(error) {
    if (session) {
      session.endSession();
      console.log(chalk.redBright("-- ABORT transaction --"))
    }

    const message = `Error updating document ${id} in the collection ${collection}.`
    processError(res, error, message)
  }
}

exports.delete = async (req, res) => {
  console.log(chalk.cyan("crud.controller.delete: called delete"))

  let session
  let id
  let collection

  try {

    // Get the collection
    collection = req.params.collection;
    const Model = require(`../models/${collection}`);

     // Get the id
    id = req.params.id;
    console.log(chalk.blue(id))
  
    // Delete Customer in the database
    let document = await Model.findById(id)
    if (!document)
        res.status(404).send({ message: "Not found document with id " + id });
    else {
      // set the deletion info
      document[c.DELETION] = req.body || {}

      var bytesize = Buffer.from(JSON.stringify(document)).length

      // start timer
      var start = process.hrtime();

      // start transaction
      session = await mongoose.startSession();
      session.startTransaction();

      // store _session in document
      document[c.SESSION] = session

      let data = await document.remove({session})    
      res.status(200).send(data);
      // alternative status 204 with no data

      // commit transaction
      await session.commitTransaction();

      // log timer
      var diff = process.hrtime(start);
      var time = `${(diff[0] * NS_PER_SEC + diff[1])/1e6}`
      fs.appendFileSync(report, ['DELETE', collection, document._version, new Date().toISOString(), bytesize, time].join(sep) + '\n')

      session.endSession();
      console.log(chalk.greenBright("-- commit transaction --"))
    
    }
  } catch(error) {
    if (session) {
      session.endSession();
      console.log(chalk.redBright("-- ABORT transaction --"))
    }
    const message = `Error deleting document ${id} in the collection ${collection}.`
    processError(res, error, message)
  }
}
  
exports.findValidVersion = async(req, res) => {
  // TODO: maybe accept a date range too
  console.log(chalk.cyan("crud.controller: called findValidVersion"))

  let id
  let date
  let collection 

  try {
    
    // Get the collection
    collection = req.params.collection;
    const Model = require(`../models/${collection}`);

    // Get request parameters
    id = req.params.id;
    
    var log_tag = "_NOW"

    if(req.query.date) {
      log_tag = "_PAST"
      date = new Date(req.query.date)
    }
    else {
      date = new Date()
    }

    if (!isValidDate(date)) {
      console.error("Bad date provided");
      res
          .status(400)
          .send({ message: "Invalid date provided " + req.query.date });
      return;    
    }

    // start timer
    var start = process.hrtime();

    let document = await Model.findValidVersion(id, date, Model)
    
    // log timer
    var diff = process.hrtime(start);
    var bytesize = Buffer.from(JSON.stringify(document)).length
    var time = `${(diff[0] * NS_PER_SEC + diff[1])/1e6}`
    if (document) fs.appendFileSync(report, ['FIND_VALID' + log_tag, collection, document._version, new Date().toISOString(), bytesize, time].join(sep) + '\n')

    if (!document) res.status(404).send({ message: "Not found document with id " + id });
    else res.send(document);

  } catch(error) {
    const message = `Error retrieving document ${id} in the collection ${collection}.`
    processError(res, error, message)
  }
};

exports.findVersion = async(req, res) => {
  console.log(chalk.cyan("crud.controller: called findVersion"))

  let id
  let version
  let collection

  try {
    // Get the collection
    collection = req.params.collection;
    const Model = require(`../models/${collection}`);
    
    // get query params
    id = req.params.id;
    version = req.params.version;

    if (!util.isValidVersion(version)) {
      console.error("Bad version provided");
      res
          .status(400)
          .send({ message: "Invalid version provided " + version });
      return;    
    }

    // start timer
    var start = process.hrtime();

    let document = await Model.findVersion(id, parseInt(version), Model)

    // log timer
    var diff = process.hrtime(start);
    var bytesize = Buffer.from(JSON.stringify(document)).length
    var time = `${(diff[0] * NS_PER_SEC + diff[1])/1e6}`
    if (document) fs.appendFileSync(report, ['FIND_VERSION' + '_' + version, collection, document._version, new Date().toISOString(), bytesize, time].join(sep) + '\n')

    if (!document) res.status(404).send({ message: "Not found document with id " + id });
    else res.send(document);

  } catch(error) {
    const message = `Error retrieving document ${id} in the collection ${collection}.`
    processError(res, error, message)
  }
};

exports.findAll = async (req, res) => {
  let collection
  try {
    // Get the collection
    collection = req.params.collection;
    const Model = require(`../models/${collection}`);

    // get the pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    console.log(chalk.cyan("crud.controller.findAll: collection=" + collection +", limit=" + limit + ", offset=" + offset))

    let documents = await Model.find({}, null, { sort: { _id: 1 } }).skip(offset).limit(limit)

    if (!documents) res.status(404).send({ message: "Not found" });
    else res.send(documents);
        
  } catch (error) {
    const message = `Error retrieving documents from collection ${collection}.`
    processError(res, error, message)
  };
};

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}


