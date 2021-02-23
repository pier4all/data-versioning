var chalk = require('chalk');

"use strict";
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
    // Make sure there's no _version path
    if (schema.path(VERSION)) {
        throw Error("Schema can't have a path called \"_version\"");
    }
    let vermongoSchema = cloneSchema(schema, options.mongoose);
    let mongoose = options.mongoose;
    // Copy schema options
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            vermongoSchema.set(key, options[key]);
        }
    }
    // Add Custom fields
    schema.add({
        _version: { type: Number, required: true, default: 0, select: true }
    });
    vermongoSchema.add({
        _id: mongoose.Schema.Types.Mixed,
        _version: { type: Number, required: true, default: 0, select: true }
    });
    // Turn off internal versioning, we don't need this since we version on everything
    schema.set("versionKey", false);
    vermongoSchema.set("versionKey", false);
    // Add reference to model to original schema
    schema.statics.VersionedModel = mongoose.model(options.collection, vermongoSchema);

    schema.pre('save', async function (next) {

        if (this.isNew) {
            // console.log('[new]');
            this[VERSION] = 1;
            return next();
        }
        //const session = await mongoose.startSession();
        //session.startTransaction();
        const session = this._session
        delete this._session

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
        await new schema.statics.VersionedModel(clone)
            .save({ session: session });

        const priority = this.priority

        console.log(chalk.magenta('[saved version] waiting... '), priority);
        //throw new Error("TESTING")
        await new Promise(resolve => setTimeout(resolve, priority * 1000));
        console.log(chalk.magenta('*** CONTINUE **** '), priority);

        next();

        // await session.commitTransaction();
        // session.endSession();
        // console.log('[Commited transaction]');
        return null;
    });

    // schema.post('save', function() {
    //     console.log(chalk.magentaBright.bold('[post save]'), 'OK')
    //     //throw new Error("Breaking the post")
    // });

    // schema.post('save', function(error, doc, next) {
    //     console.log(chalk.magentaBright.bold('[post save]'), doc.priority)
    //     if (error) {
    //         console.error(error)
    //     }
    //     if (error.name === 'MongoError' && error.code === 11000) {
    //       next(new Error('There was a duplicate key error'));
    //     } else {
    //       next(error);
    //     }
    // });

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
            // console.log('[removed]');
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
