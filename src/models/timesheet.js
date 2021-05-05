// imports
var mongoose = require('mongoose');
var versioning = require('../versioning/versioning');
mongoose.Promise = require('bluebird');

const NAME = "timesheet"
const DB_NAME = mongoose.connection.name

// schema definition
var Schema = mongoose.Schema;

let timesheetSchema = new Schema({
  "ref-project": { 
    "$id": mongoose.Schema.Types.ObjectId,
    "$ref": {type: String, default: "projects" }, 
    "$db": {type: String, default: DB_NAME }
  },
  "ref-employee": { 
    "$id": mongoose.Schema.Types.ObjectId,
    "$ref": {type: String, default: "employees" }, 
    "$db": {type: String, default: DB_NAME }
  },
  "ref-service": { 
    "$id": mongoose.Schema.Types.ObjectId,
    "$ref": {type: String, default: "services" }, 
    "$db": {type: String, default: DB_NAME }
  },
  date: { type: Date, required: true },
  quantity: { type: Number }
});

// TODO set indexes manually after adding option { autoIndex: false }
timesheetSchema.plugin(versioning, NAME + "s.versioning");

module.exports = mongoose.model(NAME, timesheetSchema);
