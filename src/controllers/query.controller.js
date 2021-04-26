
const util = require('../versioning/util')
var chalk = require('chalk');
mongoose = require('mongoose')

const { processError } = require('./error')

const fs = require('fs');
var path = require('path');
const NS_PER_SEC = 1e9;

// output path
var report_file = 'time_report_query_' + new Date().toISOString().replace('T', '_').replace(/:/g, '-').split('.')[0] + '.csv'
var report = path.join(__dirname, '..', '..', 'output', report_file)
const sep = '\t'

exports.find = async (req, res) => {
  let collection
  try {
    // Get the collection
    collection = req.params.collection;
    const Model = require(`../models/${collection}`);

    // get the pagination parameters
    let query, projection, sort, limit, offset
    try {
      query = paramList2object(req.query.query) || {};
      projection = valuesAsInt(paramList2object(req.query.projection)) || {};
      sort = valuesAsInt(paramList2object(req.query.sort)) || { _id: 1 };
      
      limit = parseInt(req.query.limit) || 10;
      offset = parseInt(req.query.offset) || 0;

    } catch (error) {    
        var parseError = new Error("Error parsing parameter: " + error.name + ": " + error.message);
        parseError.code = "BAD_PARAMETER"
        const message = "Invalid request parameter"
        processError(res, parseError, message)
        return;    
    }
    
    console.log(chalk.cyan("query.controller.find: collection=" + collection + ", query=" + JSON.stringify(query)
                                              + ", projection=" + JSON.stringify(projection) + ", sort=" + JSON.stringify(sort)
                                              + ", limit=" + limit + ", offset=" + offset))

    // start logging timer
    var start = process.hrtime();
    
    let documents = await Model.find(query, projection, { sort: sort }).skip(offset).limit(limit)

    // log timer (milliseconds)
    var diff = process.hrtime(start);
    var time = `${(diff[0] * NS_PER_SEC + diff[1])/1e6}`
    fs.appendFileSync(report, ['FIND', collection, documents.length, new Date().toISOString(), time].join(sep) + '\n')

    if (!documents) res.status(404).send({ message: "Not found" });
    else res.send(documents);
        
  } catch (error) {
    const message = `Error finding documents in collection ${collection}.`
    processError(res, error, message)
  };
};

paramList2object = (text) => {
  var obj = {}

  // try to parse as JSON in case it contains quotes
  try {
    obj = JSON.parse('{' + text + '}')
    if (obj) return obj
  } catch (error) { }

  // parse as comma separated list
  if (text) {
    for(let pair of text.split(',')) {
      let param = pair.split(':')
      if (param.length != 2) {
        throw Error("parameters are key-value pairs separated by ':'")
      }
      obj[param[0].trim()] = param[1].trim()
    }
  } 
  return obj
}

valuesAsInt = (obj) => {
  for (key in obj) {
    obj[key] = parseInt(obj[key])
  }
  return obj
}