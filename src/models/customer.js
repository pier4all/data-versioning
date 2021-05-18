// imports
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')

const versioning = require('mongoose-versioned/source/versioning')

const NAME = "customer"

// schema definition
let Schema = mongoose.Schema

let customerSchema = new Schema({
  custno: { type: Number, required: true, unique: false },
  name: { type: String, required: true },
  email : { type : String, required: true, unique: false },
  language: { type: String, required: true, default: "DE" }
})

// TODO set indexes manually after adding option { autoIndex: false }
customerSchema.plugin(versioning, {collection: NAME + "s.versioning", mongoose})

module.exports = mongoose.model(NAME, customerSchema)
