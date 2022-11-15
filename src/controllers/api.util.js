const path = require('path')

const versioningutil = require('mongoose-versioned/source/util')

const fs = require('fs')
const NS_PER_SEC = 1e9
const SEP = '\t'

// output path
const report_base_name = 'time_report_' + new Date().toISOString().replace('T', '_').replace(/:/g, '-').split('.')[0] 
const report_file_extension =  '.csv'
const report_base = path.join(__dirname, '..', '..', 'output', report_base_name)

exports.logTimerPerf = (tag, diff, num=1) => {
    const time = `${(diff[0] * NS_PER_SEC + diff[1])/1e6}`/num

    const report = report_base + "_" + tag + report_file_extension
    fs.appendFileSync(report, time + '\n')
}

exports.logTimer = (tag, diff, input, collection) => {
    const time = `${(diff[0] * NS_PER_SEC + diff[1])/1e6}`

    const report = report_base + report_file_extension

    if (input.constructor.name === 'Array') 
        fs.appendFileSync(report, [tag, collection, "0", new Date().toISOString(), input.length, time].join(SEP) + '\n')
    else {
        const bytesize = Buffer.from(JSON.stringify(input)).length
        fs.appendFileSync(report, [tag, collection, input._version, new Date().toISOString(), bytesize, time].join(SEP) + '\n')
    }
}

exports.paramList2object = (text) => {
    let obj = {}

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

exports.updateDocumentFields = (document, update) => {
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