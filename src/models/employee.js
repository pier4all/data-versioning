// imports
var mongoose = require('mongoose');
var transverse = require('../versioning/versioning');
mongoose.Promise = require('bluebird');

const NAME = "employee"

// schema definition
var Schema = mongoose.Schema;

let employeeSchema = new Schema({
  svn : { type : String, required: true, unique: true },
  lastname: { type: String, required: true },
  firstname: { type: String, required: true },
  pensum: { type: String, required: true, default: "100%"}
});

// TODO set indexes manually after adding option { autoIndex: false }
employeeSchema.plugin(transverse, NAME + "s.versioning");

module.exports = mongoose.model(NAME, employeeSchema);
