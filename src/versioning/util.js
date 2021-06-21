
var c = require("./constants")


exports.isWritable = (field) => {
    for (let key of [c.DELETER, c.EDITOR, c.ID, c.VERSION, c.VALIDITY, c.SESSION, c.DELETION]) {
        if (key == field) return false
    }
    return true
} 

exports.isValidVersion = (v) => {
    if (typeof v != "string") return false // we only process strings!  
    if (isNaN(v)) return false // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    if (isNaN(parseInt(v))) return false// ...and ensure strings of whitespace fail
    if (parseInt(v) < 1) return false
    return true
  }