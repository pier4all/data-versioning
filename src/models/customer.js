// imports
<<<<<<< HEAD
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')

const versioning = require('mongoose-versioned/source/versioning')
=======
var mongoose = require('mongoose');
// var versioning = require('../versioning/versioning');
mongoose.Promise = require('bluebird');
>>>>>>> ea60771 (first working version)

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
<<<<<<< HEAD
customerSchema.plugin(versioning, {collection: NAME + "s.versioning", mongoose})
=======
// customerSchema.plugin(versioning, NAME + "s.versioning");
>>>>>>> ea60771 (first working version)

module.exports = mongoose.model(NAME, customerSchema)
