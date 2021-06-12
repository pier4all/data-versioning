
const util = require('./api.util')
const chalk = require('chalk')
mongoose = require('mongoose')
const { processError } = require('./error')
const path = require('path')

// output path
const report_file = 'time_report_query_' + new Date().toISOString().replace('T', '_').replace(/:/g, '-').split('.')[0] + '.csv'
const report = path.join(__dirname, '..', '..', 'output', report_file)

exports.find = async (req, res) => {
  let collection
  try {
    // Get the collection
    collection = req.params.collection
    const Model = require(`../models/${collection}`)

    // get the pagination parameters
    let query, projection, sort, limit, offset
    try {
      query = util.paramList2object(req.query.query) || {}
      projection = valuesAsInt(util.paramList2object(req.query.projection)) || {}
      sort = valuesAsInt(util.paramList2object(req.query.sort)) || { _id: 1 }

      limit = parseInt(req.query.limit) || 10
      offset = parseInt(req.query.offset) || 0

    } catch (error) {
      generateValidationError(res, "Error parsing parameter: " + error.name + ": " + error.message)
      return
    }

    console.log(chalk.cyan("query.controller.find: collection=" + collection + ", query=" + JSON.stringify(query) + ", projection=" + JSON.stringify(projection) 
                                                                + ", sort=" + JSON.stringify(sort) + ", limit=" + limit + ", offset=" + offset))

    // start logging timer
    const start = process.hrtime()

    let documents = await Model.find(query, projection, { sort: sort }).skip(offset).limit(limit)

    // log timer (milliseconds)
    const diff = process.hrtime(start)
    util.logTimer(report, 'FIND', diff, documents, collection)
    
    if (!documents) res.status(404).send({ message: "Not found" })
    else res.send(documents)

  } catch (error) {
    const message = `Error finding documents in collection ${collection}.`
    processError(res, error, message)
  }
}

exports.aggregate = async (req, res) => {
  let collection
  try {
    // Get the collection
    collection = req.params.collection
    const Model = require(`../models/${collection}`)

    // get the pagination parameters
    let limit, offset
    try {
      limit = parseInt(req.query.limit) || 10
      offset = parseInt(req.query.offset) || 0
    } catch (error) {
      generateValidationError(res, "Error parsing parameter: " + error.name + ": " + error.message)
      return
    }

    let pipeline = req.body

    console.log(chalk.cyan("query.controller.aggregate: collection=" + collection + ", limit=" + limit + ", offset=" + offset
                                                   + ", pipeline=" + JSON.stringify(pipeline) ))

    // start logging timer
    const start = process.hrtime()

    let documents = await Model.aggregate(pipeline).skip(offset).limit(limit)

    // log timer (milliseconds)
    const diff = process.hrtime(start)
    util.logTimer(report, 'AGGREGATE', diff, documents, collection)

    if (!documents) res.status(404).send({ message: "Not found" })
    else res.send(documents)

  } catch (error) {
    const message = `Error finding documents in collection ${collection}.`
    processError(res, error, message)
  }
}

valuesAsInt = (obj) => {
  for (key in obj) {
    obj[key] = parseInt(obj[key])
  }
  return obj
}

generateValidationError = (res, text) => {
  const parseError = new Error(text)
  parseError.code = "BAD_PARAMETER"
  const message = "Invalid request parameter"
  processError(res, parseError, message)
}
