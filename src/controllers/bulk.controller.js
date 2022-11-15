const versioningutil = require('mongoose-versioned/source/util')
const util = require('./api.util')
const constants = require('mongoose-versioned/source/constants')
const chalk = require('chalk')
mongoose = require('mongoose')

const { processError } = require('./error')
const path = require('path')
const { Collection } = require('mongoose')
const { fromJS } = require('immutable')

exports.createMany = async (req, res) => {

  console.log(chalk.cyan("bulk.controller.createMany: called createMany"))

  let collection = undefined

  // Get the collection
  collection = req.params.collection
  const Model = require(`../models/${collection}`)

  // insert many
  const documents = []
  try {

    for (let input of req.body) {
      // Create an Model
      documents.push(new Model(input))
    }
    // start timer
    const start = process.hrtime()

    // Save the documents in the database
    await Model.insertMany(documents)

    // log timer (milliseconds)
    const diff = process.hrtime(start)
    util.logTimerPerf('INSERTMANY', diff, documents.length)

    res.status(201).send(documents)

  } catch (error) {
    const message = `Error inserting Many documents in the collection ${collection}.`
    processError(res, error, message)
  }
}

exports.updateMany = async (req, res) => {

  let session
  let collection

  try {
    console.log(chalk.cyan("bulk.controller.updateMany: called updateMany"))

    // Get the collection
    collection = req.params.collection
    const Model = require(`../models/${collection}`)

    // Validate request
    let error = validateBulkRequest(req)
    if (error) {
      processError(res, error, "Invalid request parameter")
      return
    }

    let originals = []
    let documents = []
    // modify the provided fields stkipping the protected ones
    for (let i = 0; i<req.body.length; i++) {
      let document = await Model.findById(req.body[i]._id)
      originals.push(fromJS(document.toObject()).toJS())
      documents.push(util.updateDocumentFields(document, req.body[i]))
    }

    // start timer
    const start = process.hrtime()

    // start transaction
    session = await mongoose.startSession()
    session.startTransaction()

    // store _session in document and save
    let result = await Model.bulkSaveVersioned(documents, originals, Model, {session})

    // commit transaction
    await session.commitTransaction()
    session.endSession()

    // log timer
    const diff = process.hrtime(start)
    util.logTimerPerf('UPDATEMANY', diff, documents.length)

    // return result
    res.status(200).send(result)

  } catch(error) {
    if (session) session.endSession()
    const message = `Error updating many documents in the collection ${collection}.`
    processError(res, error, message)
  }
}

exports.deleteMany = async (req, res) => {

  let session
  let collection

  try {
    console.log(chalk.cyan("bulk.controller.deleteMany: called deleteMany"))

    // Get the collection
    collection = req.params.collection
    const Model = require(`../models/${collection}`)

    // Validate request
    let error = validateBulkRequest(req)
    if (error) {
      processError(res, error, "Invalid request parameter")
      return
    }

    let documents = []
    // modify the provided fields stkipping the protected ones
    for (let i = 0; i<req.body.length; i++) {
      let document = await Model.findById(req.body[i]._id)
      documents.push(document)
    }

    // start timer
    const start = process.hrtime()

    // start transaction
    session = await mongoose.startSession()
    session.startTransaction()

    // store _session in document and save
    let result = await Model.bulkDeleteVersioned(documents, Model, {session})

    // commit transaction
    await session.commitTransaction()
    session.endSession()

    // log timer
    const diff = process.hrtime(start)
    util.logTimerPerf('DELETEMANY', diff, documents.length)

    // return result
    res.status(200).send(result)

  } catch(error) {
    if (session) session.endSession()
    const message = `Error deleting many documents in the collection ${collection}.`
    processError(res, error, message)
  }
}

function validateBulkRequest(req) {
  // Validate request
  if (!req.body) {
    const parseError = new Error("Data can not be empty")
    parseError.code = "BAD_PARAMETER"
    return parseError
  }

  // Validate request
  if (! req.body instanceof Array ) {
    const parseError = new Error("Data has to be an array")
    parseError.code = "BAD_PARAMETER"
    return parseError
  }
  return undefined
}

