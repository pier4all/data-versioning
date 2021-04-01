var chalk = require('chalk');
var util = require("./util")
var c = require("./constants")
var ObjectId = require('mongoose').Types.ObjectId; 
"use strict";

module.exports = function (schema, options) {

    //TODO: Review all this handling of the options (inherited from vermongo)
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
    if (schema.path(c.VERSION)) {
        throw Error("Schema can't have a path called \"" + c.VERSION + "\"");
    }
    if (schema.path(c.VALIDITY)) {
        throw Error("Schema can't have a path called \"" + c.VALIDITY + "\"");
    }
    if (schema.path(c.EDITOR)) {
        throw Error("Schema can't have a path called \"" + c.EDITOR + "\"");
    }
    if (schema.path(c.DELETER)) {
        throw Error("Schema can't have a path called \"" + c.DELETER + "\"");
    }
    if (schema.path(c.EDITION)) {
        throw Error("Schema can't have a path called \"" + c.EDITION + "\"");
    }
    if (schema.path(c.DELETION)) {
        throw Error("Schema can't have a path called \"" + c.DELETION + "\"");
    }
    if (schema.path(c.SESSION)) {
        throw Error("Schema can't have a path called \"" + c.SESSION + "\"");
    }

    // create the versioned schema
    let versionedSchema = util.cloneSchema(schema, mongoose);

    // Copy schema options in the versioned schema
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            versionedSchema.set(key, options[key]);
        }
    }
    
    // Define Custom fields
    // TODO: validate end should be later than start
    let validityField = {}
    validityField[c.VALIDITY] = { 
        start: { type: Date, required: true, default: Date.now },
        end: { type: Date, required: false }
    }

    // TODO: maybe set default to now and required to true if deletion implementation changes
    let versionedValidityField = {}
    versionedValidityField[c.VALIDITY] = { 
        start: { type: Date, required: false },
        end: { type: Date, required: false}
    }

    let versionField = {}
    versionField[c.VERSION] = { type: Number, required: true, default: 0, select: true }

    let versionedIdField = {}
    versionedIdField[c.ID] = mongoose.Schema.Types.Mixed
    versionedIdField[c.VERSION] = versionField[c.VERSION]

    let editorField = {}
    editorField[c.EDITOR] = { type: String, required: true, default: c.DEFAULT_EDITOR }

    let deleterField = {}
    deleterField[c.DELETER] = { type: String, required: false}

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

        // 1. check if in current collection is valid
        // TODO find out why 'this.findById' does not work
        const validity_end = c.VALIDITY + ".end"
        const validity_start = c.VALIDITY + ".start"

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
        query[c.ID + "." + c.ID] = ObjectId(id)
        query[validity_start] = { $lte: date }
        query[validity_end] = { $gt: date }
        
        let version = await versionedModel.findOne(query)
        return version
    };

    // Add special find by id and version number that includes versioning
    schema.statics.findVersion = async (id, version, model) => {

        // 1. check if version is the main collection
        // TODO find out why 'this.findById' does not work
        let query = {}
        query[c.ID] = ObjectId(id)
        query[c.VERSION] = version

        let current = await model.findOne(query)
        if (current) {
            { return current }
        }

        // 2. if not, check versioned collection
        // TODO: consider deleted documents and if we allow negative version numbers
        // we could check in two version fields
        let versionedModel = schema.statics.VersionedModel
        query = {}
        query[c.ID + "." + c.ID] = ObjectId(id)
        query[c.VERSION] = version
        
        let document = await versionedModel.findOne(query)
        return document
    };

    schema.pre('save', async function (next) {
  
        if (this.isNew) {
            this[c.VERSION] = 1;
            return next();
        }

        // get the transaction session
        const session = {session: this._session}
        delete this._session

        let baseVersion = this[c.VERSION];
        // load the base version
        let base = await this.collection
            .findOne({ [c.ID]: this[c.ID] })
            .then((foundBase) => {
            if (foundBase === null) {
                let err = new Error('document to update not found in collection');
                throw (err);
            }
            return foundBase;});

        let bV = base[c.VERSION];
        if (baseVersion !== bV) {
            let err = new Error('modified and base versions do not match');
            throw (err);
        }
        let clone = base;

        // Build Vermongo historical ID
        clone[c.ID] = { [c.ID]: this[c.ID], [c.VERSION]: this[c.VERSION] };

        // Set validity to end now for versioned and to start now for current
        const now = new Date()
        const start = base[c.VALIDITY]["start"]
        
        clone[c.VALIDITY] = {
            "start": start,
            "end": now
        }

        this[c.VALIDITY] = { "start": now }

        // Increment version number
        this[c.VERSION] = this[c.VERSION] + 1;

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
        let delete_info = this[c.DELETION] || {}
        delete this[c.DELETION]

        var clone = this.toObject();
        clone[c.ID] = { [c.ID]: this[c.ID], [c.VERSION]: this[c.VERSION] };

        const now = new Date()
        const start = this[c.VALIDITY]["start"]
        clone[c.VALIDITY] = {
            "start": start,
            "end": now
        }
        clone[c.DELETER] = delete_info[c.DELETER] || c.DEFAULT_DELETER;

        await new schema.statics.VersionedModel(clone).save(session)

        next();
        return null;
    });

    // TODO?
    schema.pre('update', function (next) { });
    schema.pre('findOneAndUpdate', function (next) { });
    schema.pre('findOneAndRemove', function (next) { });

};
