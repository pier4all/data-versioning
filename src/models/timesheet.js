// imports
<<<<<<< HEAD
const mongoose = require('mongoose')
require('../db/dbref').loadType(mongoose)
const versioning = require('mongoose-versioned/source/versioning')
mongoose.Promise = require('bluebird')
=======
var mongoose = require('mongoose');
// var versioning = require('../versioning/versioning');
mongoose.Promise = require('bluebird');
>>>>>>> ea60771 (first working version)

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
<<<<<<< HEAD
timesheetSchema.plugin(versioning, {collection: NAME + "s.versioning", mongoose})
=======
// timesheetSchema.plugin(versioning, NAME + "s.versioning");
>>>>>>> ea60771 (first working version)

module.exports = mongoose.model(NAME, timesheetSchema)
