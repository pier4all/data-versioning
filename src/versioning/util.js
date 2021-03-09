
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