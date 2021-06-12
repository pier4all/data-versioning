const fs = require('fs')
const NS_PER_SEC = 1e9
const SEP = '\t'

exports.logTimer = (report, tag, diff, input, collection) => {
    const time = `${(diff[0] * NS_PER_SEC + diff[1])/1e6}`

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