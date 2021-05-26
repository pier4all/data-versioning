const constants = require("./constants")
const fs = require('fs')

const NS_PER_SEC = 1e9
const SEP = '\t'

exports.cloneSchema = (schema, mongoose) => {
    let clonedSchema = new mongoose.Schema()
    schema.eachPath(function (path, type) {
        if (path === constants.ID) {
            return
        }
        // TODO: find a better way to clone schema
        let clonedPath = {}
        clonedPath[path] = type.options
        // shadowed props are not unique
        clonedPath[path].unique = false

        // shadowed props are not all required
        if (path !== constants.VERSION) {
            clonedPath[path].required = false
        }

        clonedSchema.add(clonedPath)
    })
    return clonedSchema
}

exports.isWritable = (field) => {
    return !constants.RESERVED_FIELDS.find(
        key => key === field
    )
}

exports.isValidVersion = (v) => {
    if (typeof v != "string") return false // we only process strings!
    if (isNaN(v)) return false // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    if (isNaN(parseInt(v))) return false// ...and ensure strings of whitespace fail
    if (parseInt(v) < 1) return false
    return true
  }

  exports.logTimer = (report, tag, diff, document, collection) => {
    const time = `${(diff[0] * NS_PER_SEC + diff[1])/1e6}`
    const bytesize = Buffer.from(JSON.stringify(document)).length
    fs.appendFileSync(report, [tag, collection, document._version, new Date().toISOString(), bytesize, time].join(SEP) + '\n')
  }