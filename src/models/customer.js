// imports
const mongoose = require('mongoose')
const versioning = require('../versioning/versioning')
mongoose.Promise = require('bluebird')

const NAME = "customer"

// schema definition
let Schema = mongoose.Schema

let customerSchema = new Schema({
  custno: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  email : { type : String, required: true, unique: true },
  language: { type: String, required: true, default: "DE" }
})

// TODO set indexes manually after adding option { autoIndex: false }
customerSchema.plugin(versioning, NAME + "s.versioning")

module.exports = mongoose.model(NAME, customerSchema)
