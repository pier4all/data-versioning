// imports
var mongoose = require('mongoose');
var transverse = require('../versioning/versioning');
mongoose.Promise = require('bluebird');

const NAME = "timesheet"

// schema definition
var Schema = mongoose.Schema;

let timesheetSchema = new Schema({
  "ref-project": { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true },
  "ref-employee": { type: mongoose.Schema.Types.ObjectId, ref: "employee", required: true },
  date: { type: Date, required: true },
  "ref-service": { type: mongoose.Schema.Types.ObjectId, ref: "service", required: true },
  quantity: { type: Number }
});

// TODO set indexes manually after adding option { autoIndex: false }
timesheetSchema.plugin(transverse, NAME + "s.versioning");

module.exports = mongoose.model(NAME, timesheetSchema);
