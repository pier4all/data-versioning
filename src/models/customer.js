// imports
var mongoose = require('mongoose');
var transverse = require('../versioning/versioning');
mongoose.Promise = require('bluebird');

const NAME = "customer"

// schema definition
var Schema = mongoose.Schema;

let customerSchema = new Schema({
  name: { type: String, required: true },
  email : { type : String, required: true, unique: true },
  language: { type: String, required: true, default: "DE" }
});

// TODO set indexes manually after adding option { autoIndex: false }
customerSchema.plugin(transverse, NAME + "s.versioning");

module.exports = mongoose.model(NAME, customerSchema);
