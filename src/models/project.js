// imports
const mongoose = require('mongoose')
require('../db/dbref').loadType(mongoose)
const versioning = require('../versioning/versioning')
mongoose.Promise = require('bluebird')

const NAME = "project"

// schema definition
let Schema = mongoose.Schema

let projectSchema = new Schema({
  prono: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  "ref-customer" : mongoose.Schema.Types.DBRef,
  "ref-employee" : mongoose.Schema.Types.DBRef
})

// TODO set indexes manually after adding option { autoIndex: false }
projectSchema.plugin(versioning, NAME + "s.versioning")

module.exports = mongoose.model(NAME, projectSchema)
