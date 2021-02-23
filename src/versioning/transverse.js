var chalk = require('chalk');
"use strict";

// Constants
const VERSION = "_version";
const ID = "_id";

function cloneSchema(schema, mongoose) {
    let clonedSchema = new mongoose.Schema();
    schema.eachPath(function (path, type) {
        if (path === ID) {
            return;
        }
        // TODO: find a better way to clone schema
        let clonedPath = {};
        clonedPath[path] = type.options;
        clonedPath[path].unique = false;
        // shadowed props are not all required
        if (path !== VERSION) {
            clonedPath[path].required = false;
        }
        clonedSchema.add(clonedPath);
    });
    return clonedSchema;
}

module.exports = function (schema, options) {
    if (typeof (options) == 'string') {
        options = {
            collection: options
        };
    }
    options = options || {};
    options.collection = options.collection || 'versions';
    options.logError = options.logError || false;
    options.mongoose = options.mongoose || require('mongoose');
    let mongoose = options.mongoose;

    // Make sure there's no _version path
    if (schema.path(VERSION)) {
        throw Error("Schema can't have a path called \"_version\"");
    }

    // create the versioned schema
    let versionedSchema = cloneSchema(schema, mongoose);

    // Copy schema options in the versioned schema
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            versionedSchema.set(key, options[key]);
        }
    }
    // Add Custom fields
    schema.add({
        _version: { type: Number, required: true, default: 0, select: true }
    });
    versionedSchema.add({
        _id: mongoose.Schema.Types.Mixed,
        _version: { type: Number, required: true, default: 0, select: true }
    });

    // Turn off internal versioning, we don't need this since we version on everything
    schema.set("versionKey", false);
    versionedSchema.set("versionKey", false);
    
    // Add reference to model to original schema
    schema.statics.VersionedModel = mongoose.model(options.collection, versionedSchema);

    schema.pre('save', async function (next) {

        if (this.isNew) {
            console.log('[new]');
            this[VERSION] = 1;
            return next();
        }

        let baseVersion = this[VERSION];
        // load the base version
        let base = await this.collection
            .findOne({ [ID]: this[ID] })
            .then((foundBase) => {
            if (foundBase === null) {
                let err = new Error('document to update not found in collection');
                throw (err);
            }
            return foundBase;});

        let bV = base[VERSION];
        if (baseVersion !== bV) {
            let err = new Error('modified and base versions do not match');
            throw (err);
        }
        let clone = base;

        // Build Vermongo historical ID
        clone[ID] = { [ID]: this[ID], [VERSION]: this[VERSION] };

        // Increment version number
        this[VERSION] = this[VERSION] + 1;

        // Save versioned document
        await new schema.statics.VersionedModel(clone).save();

        next();
        return null;
    });

    schema.post('save', async function(error, doc, next) {
        // clean up the versioned document in case it exists
        console.log(chalk.redBright.bold('[post save ERROR]'), doc.priority)
        try {
            let base = await this.collection.findOne({ [ID]: doc[ID] })
            let versionedId = { [ID]: doc[ID], [VERSION]: base[VERSION] }
            let versionedDoc = await schema.statics.VersionedModel.findById(versionedId)

            if (versionedDoc) {
                console.log(chalk.redBright('[post save ERROR]: Deleting versioned document'), versionedId)
                versionedDoc.remove()    
            } else {
                console.log(chalk.red.italic('[post save ERROR]: No versioned document'), versionedId)
            }
        } catch(remove_error)  {
            console.error("Error occurred while deleting the versioned document with id=" + versionedId, remove_error.message);
        }
        next(error);
    });

    schema.pre('remove', function (next) {
        var clone = this.toObject();
        clone[ID] = { [ID]: this[ID], [VERSION]: this[VERSION] };
        new schema.statics.VersionedModel(clone)
            .save()
            .then(() => {
            this[VERSION]++;
            let deletedClone = {
                [ID]: { [ID]: this[ID], [VERSION]: this[VERSION] },
                [VERSION]: -1
            };
            return new schema.statics.VersionedModel(deletedClone)
                .save();
        })
            .then(() => {
            console.log('[removed]');
            next();
            return null;
        })
            .catch((err) => {
            if (options.logError) {
                console.log(err);
            }
            next(err);
            return null;
        });
    });

    // TODO
    schema.pre('update', function (next) { });
    schema.pre('findOneAndUpdate', function (next) { });
    schema.pre('findOneAndRemove', function (next) { });
};
