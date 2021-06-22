// imports
var mongoose = require('mongoose');
// var versioning = require('../versioning/versioning');
mongoose.Promise = require('bluebird');

const NAME = "project"

// schema definition
let Schema = mongoose.Schema

let projectSchema = new Schema({
  prono: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  "ref-customer" : { type: mongoose.Schema.Types.ObjectId, ref: 'customer'},
  "ref-employee" : { type: mongoose.Schema.Types.ObjectId, ref: 'employee'} 
})

// TODO set indexes manually after adding option { autoIndex: false }
// projectSchema.plugin(versioning, NAME + "s.versioning");

module.exports = mongoose.model(NAME, projectSchema)
