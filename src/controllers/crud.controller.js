const versioningutil = require('mongoose-versioned/source/util')
const util = require('./api.util')
const constants = require('mongoose-versioned/source/constants')
const chalk = require('chalk')
mongoose = require('mongoose')

const { processError } = require('./error')
const path = require('path')

exports.create = async (req, res) => {

  console.log(chalk.cyan("crud.controller.create: called create"))

  let collection = undefined

  try {

    // Get the collection
    collection = req.params.collection
    const Model = require(`../models/${collection}`)

    // Create an Model
    const document = new Model(req.body)

    // start timer
    const start = process.hrtime()

    // Save Customer in the database
    await document.save()

    // log timer (milliseconds)
    const diff = process.hrtime(start)
    util.logTimerPerf('INSERT', diff)

    res.status(201).send(document)

  } catch (error) {
    const message = `Error creating a document in the collection ${collection}.`
    processError(res, error, message)
  }
}

exports.update = async (req, res) => {

  let session
  let id
  let version
  let collection

  try {
    console.log(chalk.cyan("crud.controller.update: called update"))

    // Get the collection
    collection = req.params.collection
    const Model = require(`../models/${collection}`)

    // Validate request
    let error = validateUpdateRequest(req)
    if (error) {
      processError(res, error, "Invalid request parameter")
      return
    }

    // Find Customer in the database
    id = req.params.id
    let document = await Model.findById(id)

    if (!document) {
      res.status(404).send({ message: "Not found document with id " + id })
      return
    }

    version = parseInt(req.params.version)
    // // validate document version
    // if (document._version != version) {
    //   res.status(404).send({ message: `Version of document with id ${id} do not match: existing document version is ${document._version}, got ${version}`})
    //   return
    // }

    // modify the provided fields stkipping the protected ones
    document = updateDocumentFields(document, req.body)

    // start timer
    const start = process.hrtime()

    // start transaction
    session = await mongoose.startSession()
    session.startTransaction()

    // store _session in document
    // document[c.SESSION] = session

    await document.save({session})   

    // commit transaction
    await session.commitTransaction()
    session.endSession()

    // log timer
    const diff = process.hrtime(start)
    util.logTimerPerf('UPDATE', diff)

    // return result
    res.status(200).send(document)

  } catch(error) {
    if (session) session.endSession()
    const message = `Error updating document ${id} in the collection ${collection}.`
    processError(res, error, message)
  }
}

exports.delete = async (req, res) => {
  console.log(chalk.cyan("crud.controller.delete: called delete"))

  let session
  let id, version
  let collection

  try {

    // Get the collection
    collection = req.params.collection
    const Model = require(`../models/${collection}`)

     // Get the id
    id = req.params.id

    // Delete Customer in the database
    let document = await Model.findById(id)
    if (!document) {
        res.status(404).send({ message: "Not found document with id " + id })
        return
    }

    // validate document version
    version = parseInt(req.params.version)
    // if (document._version != version) {
    //   res.status(404).send({ message: `Version of document with id ${id} do not match: existing document version is ${document._version}, got ${version}`})
    //   return
    // }

    // set the deletion info
    document[constants.DELETION] = req.body || {}

    // start timer
    const start = process.hrtime()

    // start transaction
    // session = await mongoose.startSession()
    // session.startTransaction()

    // store _session in document and remove
    // document[constants.SESSION] = session
    let data = await document.remove()    

    // commit transaction
    // await session.commitTransaction()
    // session.endSession()

    // log timer
    const diff = process.hrtime(start)
    util.logTimerPerf('DELETE', diff)

    res.status(200).send(data)
    
  } catch(error) {
    // if (session) session.endSession()
    
    const message = `Error deleting document ${id} in the collection ${collection}.`
    processError(res, error, message)
  }
}

exports.findValidVersion = async(req, res) => {
  console.log(chalk.cyan("crud.controller: called findValidVersion"))

  let id
  let date
  let collection

  try {

    // Get the collection
    collection = req.params.collection
    const Model = require(`../models/${collection}`)

    // Get request parameters
    id = req.params.id

    let log_tag = "_NOW"

    if(req.query.date) {
      log_tag = "_PAST"
      date = new Date(req.query.date)
    }
    else date = new Date()

    if (!isValidDate(date)) {
      console.error("Bad date provided")
      res
          .status(400)
          .send({ message: "Invalid date provided " + req.query.date })
      return
    }

    // start timer
    const start = process.hrtime()

    let document = await Model.findById(id)
    
    // log timer
    const diff = process.hrtime(start)
    if (document) util.logTimerPerf('FIND_VALID' + log_tag, diff)

    if (!document) res.status(404).send({ message: "Not found document with id " + id })
    else res.send(document)

  } catch(error) {
    const message = `Error retrieving document ${id} in the collection ${collection}.`
    processError(res, error, message)
  }
}

exports.findVersion = async(req, res) => {
  console.log(chalk.cyan("crud.controller: called findVersion"))

  let id
  let version
  let collection

  try {
    // Get the collection
    collection = req.params.collection
    const Model = require(`../models/${collection}`)

    // get query params
    id = req.params.id
    version = req.params.version

    if (!versioningutil.isValidVersion(version)) {
      console.error("Bad version provided")
      res.status(400).send({ message: "Invalid version provided " + version })
      return
    }

    // start timer
    const start = process.hrtime()

    let document = await Model.findById(id)

    // log timer
    const diff = process.hrtime(start)
    if (document) util.logTimerPerf('FIND_VERSION' + '_' + version, diff)

    if (!document) res.status(404).send({ message: "Not found document with id " + id })
    else res.send(document)

  } catch(error) {
    const message = `Error retrieving document ${id} in the collection ${collection}.`
    processError(res, error, message)
  }
}

exports.findAll = async (req, res) => {
  let collection
  try {
    // Get the collection
    collection = req.params.collection
    const Model = require(`../models/${collection}`)

    // get the pagination parameters
    const limit = parseInt(req.query.limit) || 10
    const offset = parseInt(req.query.offset) || 0

    console.log(chalk.cyan("crud.controller.findAll: collection=" + collection +", limit=" + limit + ", offset=" + offset))

    const documents = await Model.find({}, null, { sort: { _id: 1 } }).skip(offset).limit(limit)

    if (!documents) res.status(404).send({ message: "Not found" })
    else res.send(documents)

  } catch (error) {
    const message = `Error retrieving documents from collection ${collection}.`
    processError(res, error, message)
  }
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d)
}

function validateUpdateRequest(req) {
  // Validate request
  if (!req.body) {
    const parseError = new Error("Data to update can not be empty")
    parseError.code = "BAD_PARAMETER"
    return parseError
  }

  version = req.params.version  
  if (!versioningutil.isValidVersion(version)) {
    const parseError = new Error("Invalid version provided: " + version)
    parseError.code = "BAD_PARAMETER"
    return parseError
  }
  return undefined
}

function updateDocumentFields(document, update) {
  // modify the provided fields stkipping the protected ones
  for (let key in update) {
    if (update.hasOwnProperty(key)) {
      if (versioningutil.isWritable(key)) 
        document[key] = update[key]
      else 
        if (update[key] != document[key]) 
          console.warn( chalk.red("WARNING: crud.controller.js: Attempting to update non writable attribute " + key ))
    }
  }
  return document
}