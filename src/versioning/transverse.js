var chalk = require('chalk');
"use strict";

// Constants
const VERSION = "_version";
const ID = "_id";
const VALIDITY = "_validity";
const EDITOR = "_editor";
const DELETER = "_deleter";
const DEFAULT_EDITOR = "default";
const DELETION = "_deletion";

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

    // Make sure there's no reserved paths
    if (schema.path(VERSION)) {
        throw Error("Schema can't have a path called \"" + VERSION + "\"");
    }
    if (schema.path(VALIDITY)) {
        throw Error("Schema can't have a path called \"" + VALIDITY + "\"");
    }
    if (schema.path(EDITOR)) {
        throw Error("Schema can't have a path called \"" + EDITOR + "\"");
    }
    if (schema.path(DELETER)) {
        throw Error("Schema can't have a path called \"" + DELETER + "\"");
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

    // TODO: maybe set default to now and required to true if deletion implementation changes
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

    let editorField = {}
    editorField[EDITOR] = { type: String, required: true, default: DEFAULT_EDITOR }

    let deleterField = {}
    deleterField[DELETER] = { type: String, required: false}

    // Add Custom fields
    schema.add(validityField)
    schema.add(versionField);
    schema.add(editorField);
    schema.add(deleterField);

    versionedSchema.add(versionedIdField);
    versionedSchema.add(versionedValidityField);
    versionedSchema.add(editorField);
    versionedSchema.add(deleterField);

    // Turn off internal versioning, we don't need this since we version on everything
    schema.set("versionKey", false);
    versionedSchema.set("versionKey", false);
    
    // Add reference to model to original schema
    schema.statics.VersionedModel = mongoose.model(options.collection, versionedSchema);

    // Add special find by id and validity date that includes versioning
    schema.statics.findValidVersion = async (id, date, model) => {
        console.log(chalk.keyword('orange')('Find with versions'), id, date );

        var ObjectId = require('mongoose').Types.ObjectId; 

        // 1. check if in current collection is valid
        // TODO find out why 'this.findById' does not work
        const validity_end = VALIDITY + ".end"
        const validity_start = VALIDITY + ".start"

        let query = { "_id": ObjectId(id)}
        query[validity_start] = { $lte: date }

        let current = await model.findOne(query)
        if (current) {
            { return current }
        }

        // 2. if not, check versioned collection
        // TODO: consider deleted documents if they have a validity
        let versionedModel = schema.statics.VersionedModel
        query = {}
        query[ID + "." + ID] = ObjectId(id)
        query[validity_start] = { $lte: date }
        query[validity_end] = { $gt: date }
        
        let version = await versionedModel.findOne(query)
        return version
    };

    // Add special find by id and version number that includes versioning
    schema.statics.findVersion = async (id, version, model) => {
        console.log(chalk.keyword('orange')('Find with versions'), id, version );

        var ObjectId = require('mongoose').Types.ObjectId; 

        // 1. check if version is the main collection
        // TODO find out why 'this.findById' does not work
        let query = {}
        query[ID] = ObjectId(id)
        query[VERSION] = version

        let current = await model.findOne(query)
        if (current) {
            { return current }
        }

        // 2. if not, check versioned collection
        // TODO: consider deleted documents and if we allow negative version numbers
        // we could check in two version fields
        let versionedModel = schema.statics.VersionedModel
        query = {}
        query[ID + "." + ID] = ObjectId(id)
        query[VERSION] = version
        
        let document = await versionedModel.findOne(query)
        return document
    };

    schema.pre('save', async function (next) {

        if (this.isNew) {
            console.log('[new]');
            this[VERSION] = 1;
            return next();
        }

        // get the transaction session
        const session = {session: this._session}
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

        // Set validity to end now for versioned and to start now for current
        const now = new Date()
        const start = base[VALIDITY]["start"]
        
        clone[VALIDITY] = {
            "start": start,
            "end": now
        }

        this[VALIDITY] = { "start": now }

        // Increment version number
        this[VERSION] = this[VERSION] + 1;

        // Save versioned document
        await new schema.statics.VersionedModel(clone).save(session);

        next();
        return null;
    });

    schema.pre('remove', async function (next) {

        // get the transaction session
        const session = {session: this._session}
        delete this._session

        // save current version clone in shadow collection 
        let delete_info = this[DELETION]
        delete this[DELETION]

        var clone = this.toObject();
        clone[ID] = { [ID]: this[ID], [VERSION]: this[VERSION] };

        const now = new Date()
        const start = this[VALIDITY]["start"]
        clone[VALIDITY] = {
            "start": start,
            "end": now
        }
        clone[DELETER] = delete_info[DELETER] || "deleter";

        await new schema.statics.VersionedModel(clone).save(session)

        console.log('[removed]');

        next();
        return null;
    });

    // TODO
    schema.pre('update', function (next) { });
    schema.pre('findOneAndUpdate', function (next) { });
    schema.pre('findOneAndRemove', function (next) { });

};
