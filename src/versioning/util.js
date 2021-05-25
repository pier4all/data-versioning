/* JCS: name the parameter */
var c = require("./constants")

exports.cloneSchema = (schema, mongoose) => {
    let clonedSchema = new mongoose.Schema();
    schema.eachPath(function (path, type) {
        if (path === c.ID) {
            return;
        }
        // TODO: find a better way to clone schema
        let clonedPath = {};
        clonedPath[path] = type.options;
        // shadowed props are not unique
        clonedPath[path].unique = false;

        // shadowed props are not all required
        // if (path !== c.VERSION) {
        //     clonedPath[path].required = false;
        // }
        clonedSchema.add(clonedPath);
    });
    return clonedSchema;
}

exports.isWritable = (field) => {
    /* JCS: simpler
    ![c.DELETER, c.EDITOR, c.ID, c.VERSION, c.VALIDITY, c.SESSION, c.DELETION].find(
        key => key === field
    )
    */

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
