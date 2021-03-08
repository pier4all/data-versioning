var chalk = require('chalk');
"use strict";

// Constants
const VERSION = "_version";
const ID = "_id";
const VALIDITY = "_validity";

function cloneSchema(schema, mongoose) {
    let clonedSchema = new mongoose.Schema();
    schema.eachPath(function (path, type) {
        if (path === ID) {
            return;
        }
        // TODO: find a better way to clone schema
        let clonedPath = {};
        clonedPath[path] = type.options;
        // shadowed props are not unique
        clonedPath[path].unique = false;

        // shadowed props are not all required
        if (path !== VERSION) {
            clonedPath[path].required = false;
        }
        clonedSchema.add(clonedPath);
    });
    return clonedSchema;
}

async function rollbackDeletion(model, schema, doc) {
    var docId = doc[ID] || undefined
    try {
        let base = await model.collection.findOne({ [ID]: doc[ID] })

        if (base) {
            let versionedId = { [ID]: doc[ID], [VERSION]: base[VERSION] }
            let versionedDoc = await schema.statics.VersionedModel.findById(versionedId)

            if (versionedDoc) {
                console.log(chalk.keyword('orange')('[post delete]: Deleting versioned document'), versionedId)
                versionedDoc.remove()    
            } else {
                console.log(chalk.keyword('orange')('[post delete WARNING]: No versioned document'), versionedId)
            }

            let deletionId = { [ID]: doc[ID], [VERSION]: base[VERSION]+1 }
            let deletionDoc = await schema.statics.VersionedModel.findById(deletionId)

            if (deletionDoc) {
                console.log(chalk.keyword('orange')('[post delete ERROR]: Deleting versioned document'), deletionId)
                deletionDoc.remove()    
            } else {
                console.log(chalk.keyword('orange')('[post delete ERROR]: No versioned document'), deletionId)
            }
        }
    } catch(remove_error)  {
        console.error(chalk.red("Error occurred while deleting the versioned document with id=" + docId, remove_error.message));
    }
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
    
    // Define Custom fields
    // TODO: validate end should be later than start
    let validityField = {}
    validityField[VALIDITY] = { 
        start: { type: Date, required: true, default: Date.now },
        end: { type: Date, required: false }
    }

    let versionedValidityField = {}
    versionedValidityField[VALIDITY] = { 
        start: { type: Date, required: false },
        end: { type: Date, required: false}
    }

    let versionField = {}
    versionField[VERSION] = { type: Number, required: true, default: 0, select: true }

    let versionedIdField = {}
    versionedIdField[ID] = mongoose.Schema.Types.Mixed
    versionedIdField[VERSION] = versionField[VERSION]

    // Add Custom fields
    schema.add(validityField)
    schema.add(versionField);

    versionedSchema.add(versionedIdField);
    versionedSchema.add(versionedValidityField)

    // Turn off internal versioning, we don't need this since we version on everything
    schema.set("versionKey", false);
    versionedSchema.set("versionKey", false);
    
    // Add reference to model to original schema
    schema.statics.VersionedModel = mongoose.model(options.collection, versionedSchema);

    //add special find
    schema.statics.findVersion = async (id, date, model) => {
        console.log(chalk.keyword('orange')('Find with versions'), id, date );

        var ObjectId = require('mongoose').Types.ObjectId; 

        // 1. check if in current collection is valid
        // TODO find out why 'this.findById' does not work
        const validity_end = VALIDITY + ".end"
        const validity_start = VALIDITY + ".start"
        let current = await model.findOne({
                "_id": ObjectId(id),
                "$or": [{ validity_end:{ $gt: date }}, { validity_end: null }], 
                validity_start:{ $lte: date }
        })
        if (current) {
            { return current }
        }

        // 2. if not, check versioned collection
        // TODO: deleted documents
        let versionedModel = schema.statics.VersionedModel
        let query = {}
        query[ID + "." + ID] = ObjectId(id)
        query[validity_end] = { $gt: date }
        query[validity_start] = { $lte: date }
        
        let version = await versionedModel.findOne(query)
        return version
    };

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

        // Set validity to end now for versioned and to start now for current
        const now = new Date()
        const start = base[VALIDITY]["start"]
        const end = base[VALIDITY]["end"]
        
        clone[VALIDITY] = {
            "start": start,
            "end": now
        }

        this[VALIDITY] = { "start": now }
        //TODO: decide how to handle this
        if (end) {
            if (end.getTime() < now.getTime()) {
                throw new Error("End date cannot be in the past")
             }
            this[VALIDITY]["end"] = end
        }

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

    schema.pre('remove', async function (next) {
        try {
            // TODO take care of rollback (post)
            // save current version clone in shadow collection 
            let deletionPayload = this.delete_info
            delete this.delete_info

            var clone = this.toObject();
            clone[ID] = { [ID]: this[ID], [VERSION]: this[VERSION] };

            const now = new Date()
            const start = this[VALIDITY]["start"]
            clone[VALIDITY] = {
                "start": start,
                "end": now
            }
            await new schema.statics.VersionedModel(clone).save()
    
            // save 'deletion' version in the shadow collection
                
            this[VERSION]++;
            let deletedClone = {
                [ID]: { [ID]: this[ID], [VERSION]: this[VERSION] },
                [VERSION]: -1
            };
            delete deletedClone[VALIDITY]

            if (deletionPayload) {
                for (var key in deletionPayload) {
                    if (deletionPayload.hasOwnProperty(key)) {
                        deletedClone[key] = deletionPayload[key];
                    }
                }
            }

            await new schema.statics.VersionedModel(deletedClone).save();

            console.log('[removed]');

            next();
            return null;
        
        } catch (err) {
            if (options.logError) {
                console.log(err);
            }
            await rollbackDeletion(this, schema, this.toObject())
            next(err);
            return null;
        }
    });

    schema.post('delete', async function(error, doc, next) {

        // clean up the versioned document in case it exists
        console.log(chalk.keyword('orange').bold('[post delete ERROR]'), doc.priority)
        await rollbackDeletion(this, schema, doc)
        next(error);
    });

    // TODO
    schema.pre('update', function (next) { });
    schema.pre('findOneAndUpdate', function (next) { });
    schema.pre('findOneAndRemove', function (next) { });

};
