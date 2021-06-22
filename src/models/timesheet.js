// imports
var mongoose = require('mongoose');
// var versioning = require('../versioning/versioning');
mongoose.Promise = require('bluebird');

const NAME = "timesheet"
const DB_NAME = mongoose.connection.name

// schema definition
let Schema = mongoose.Schema

let timesheetSchema = new Schema({
  "ref-project": { type: mongoose.Schema.Types.ObjectId, ref: 'project'},
  "ref-employee": { type: mongoose.Schema.Types.ObjectId, ref: 'employee'},
  "ref-service": { type: mongoose.Schema.Types.ObjectId, ref: 'service'},
  date: { type: Date, required: true },
  quantity: { type: Number }
})

// TODO set indexes manually after adding option { autoIndex: false }
// timesheetSchema.plugin(versioning, NAME + "s.versioning");

module.exports = mongoose.model(NAME, timesheetSchema)
