var chalk = require('chalk');
// var util = require("./util")
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

    let validityField = {}
    validityField[c.VALIDITY] = { 
        start: { type: Date, required: true, default: Date.now },
        end: { type: Date, required: false }
    }

    let editorField = {}
    editorField[c.EDITOR] = { type: String, required: true, default: c.DEFAULT_EDITOR }

    let deleterField = {}
    deleterField[c.DELETER] = { type: String, required: false }

    let versionField = {}
    versionField[c.VERSION] = { type: Number, required: true, default: 1, select: true }

    // Add Custom fields
    schema.add(validityField)
    schema.add(editorField);
    schema.add(deleterField);

    // id
    let versionedIdField = {}
    versionedIdField[c.ID] = {}
    versionedIdField[c.ID][c.ID] = { type: mongoose.Schema.Types.ObjectId, required: false }
    versionedIdField[c.ID][c.VERSION] = versionField[c.VERSION]
    console.log(JSON.stringify(versionedIdField))

    schema.remove(c.ID)
    schema.add(versionedIdField);

    var versionedIdIndex = {}
    versionedIdIndex[c.ID + '.' + c.ID] = 1
    versionedIdIndex[c.ID + '.' + c.VERSION] = 1
    schema.index(versionedIdIndex)

    // add index to versioning (id, validity), 
    const validity_end = c.VALIDITY + ".end"
    const validity_start = c.VALIDITY + ".start"

    var versionedValidityIndex = {}
    versionedValidityIndex[c.ID + '.' + c.ID] = 1
    versionedValidityIndex[validity_start] = 1
    versionedValidityIndex[validity_end] = 1
    schema.index(versionedValidityIndex)
    // this.mongoose.getCollection("employees").createIndex(versionedValidityIndex, "_id._id_1__validity_1")

    // TODO: check if it worths to add (id, version), (id, validity) to mail collection

    // Turn off internal versioning, we don't need this since we version on everything
    schema.set("versionKey", false);
 
    schema.statics.ensureIndexes = async(model) => {
        var versionedIdIndex = {}
        versionedIdIndex[c.ID + '.' + c.ID] = 1
        versionedIdIndex[c.ID + '.' + c.VERSION] = 1
        model.collection.createIndex(versionedIdIndex)
    
        // add index to versioning (id, validity), 
        const validity_end = c.VALIDITY + ".end"
        const validity_start = c.VALIDITY + ".start"
    
        var versionedValidityIndex = {}
        versionedValidityIndex[c.ID + '.' + c.ID] = 1
        versionedValidityIndex[validity_start] = 1
        versionedValidityIndex[validity_end] = 1
    
        model.collection.createIndex(versionedValidityIndex)
    }
    

    // Add special find by id and validity date that includes versioning
    schema.statics.findValidVersion = async (id, date, model) => {

        // 1. check if in current collection is valid
        // TODO find out why 'this.findById' does not work
        const validity_end = c.VALIDITY + ".end"
        const validity_start = c.VALIDITY + ".start"

        let query = { "_id": ObjectId(id)}
        query[validity_start] = { $lte: date }

        query = {}
        query[c.ID + "." + c.ID] = ObjectId(id)
        query[validity_start] = { $lte: date }
        validity_end_filter = {}
        validity_end_filter[validity_end] = { $gt: date }
        validity_end_undefined = {}
        validity_end_undefined[validity_end] = { $exists: false }

        query["$or"] = [validity_end_filter, validity_end_undefined]
        console.log(chalk.magenta(JSON.stringify(query)))
        
        let version = await model.findOne(query)
        return version
    };

    // Add special find by id and version number that includes versioning
    schema.statics.findVersion = async (id, version, model) => {

        let query = {}
        query[c.ID + "." + c.ID] = ObjectId(id)
        query[c.ID + "." + c.VERSION] = version

        console.log(chalk.magenta(`versioning.js: findVersion query = ${JSON.stringify(query)}`))
        let document = await model.findOne(query)
        return document
    };

    // schema.pre('save', async function (next) {
  
    //     if (this.isNew) {
    //         if (!this[c.ID][c.ID]) {this[c.ID][c.ID] = new ObjectId() }
    //         return next();
    //     }

    //     // get the transaction session
    //     const session = {session: this._session}
    //     delete this._session

    //     let baseVersion = this[c.ID][c.VERSION];
    //     // load the base version
    //     let query = {}
    //     query[`${c.ID}.${c.ID}`] = this[c.ID][c.ID]
        
    //     let sort = {}
    //     sort[`${c.ID}.${c.VERSION}`] = -1

    //     let base = await this.collection
    //         .findOne(query, null, sort)
    //         .then((foundBase) => {
    //         if (foundBase === null) {
    //             let err = new Error('document to update not found in collection');
    //             throw (err);
    //         }
    //         return foundBase;});

    //     let bV = base[c.ID][c.VERSION];
    //     if (baseVersion !== bV) {
    //         let err = new Error('modified and base versions do not match');
    //         throw (err);
    //     }

    //     if (base[c.VALIDITY]["end"]) {
    //         let err = new Error('version is deleted');
    //         throw (err);
    //     }

    //     let clone =  Object.assign({}, base);

    //     // Set validity to end now for versioned and to start now for current
    //     const now = new Date()
    //     const start = base[c.VALIDITY]["start"]
        
    //     clone[c.VALIDITY] = {
    //         "start": start,
    //         "end": now
    //     }

    //     this[c.VALIDITY] = { "start": now }

    //     // Increment version number
    //     this[c.ID][c.VERSION] = this[c.ID][c.VERSION] + 1;

    //     console.log(JSON.stringify(this))
    //     // Save versioned document
    //     console.log(chalk.magentaBright(`versioning.save: ${JSON.stringify(clone, null, 2)}`))
    //     console.log(chalk.magentaBright(`versioning.save: ${clone}`))
    //     // var versionedDoc = new this.Model(clone)

    //     await clone.save(session);

    //     next();
    //     return null;
    // });

    // schema.pre('remove', async function (next) {

    //     // get the transaction session
    //     const session = {session: this._session}
    //     delete this._session

    //     // save current version clone in shadow collection 
    //     let delete_info = this[c.DELETION] || {}
    //     delete this[c.DELETION]

    //     let clone = JSON.parse(JSON.stringify(this.toObject()));

    //     clone[c.ID] = { [c.ID]: this[c.ID], [c.VERSION]: this[c.VERSION] };

    //     const now = new Date()
    //     const start = this[c.VALIDITY]["start"]
    //     clone[c.VALIDITY] = {
    //         "start": start,
    //         "end": now
    //     }
    //     clone[c.DELETER] = delete_info[c.DELETER] || c.DEFAULT_DELETER;

    //     await new schema(clone).save(session)

    //     next();
    //     return null;
    // });

    // TODO?
    schema.pre('update', function (next) { });
    schema.pre('findOneAndUpdate', function (next) { });
    schema.pre('findOneAndRemove', function (next) { });

};
