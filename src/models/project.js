// imports
var mongoose = require('mongoose');
var versioning = require('../versioning/versioning');
mongoose.Promise = require('bluebird');

const NAME = "project"
const DB_NAME = mongoose.connection.name

// schema definition
var Schema = mongoose.Schema;

let projectSchema = new Schema({
  prono: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  "ref-customer" : { 
    "$id": mongoose.Schema.Types.ObjectId, 
    "$ref": {type: String, default: "customers" }, 
    "$db": {type: String, default: DB_NAME }, 
    required: true
  },
  "ref-employee" : { 
    "$id": mongoose.Schema.Types.ObjectId, 
    "$ref": {type: String, default: "employees" }, 
    "$db": {type: String, default: DB_NAME },
    required: true
  }
});

// TODO set indexes manually after adding option { autoIndex: false }
projectSchema.plugin(versioning, NAME + "s.versioning");

module.exports = mongoose.model(NAME, projectSchema);
