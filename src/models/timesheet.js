// imports
const mongoose = require('mongoose')
require('../db/dbref').loadType(mongoose)
const versioning = require('../versioning/versioning')
mongoose.Promise = require('bluebird')

const NAME = "timesheet"
const DB_NAME = mongoose.connection.name

// schema definition
let Schema = mongoose.Schema

let timesheetSchema = new Schema({
  "ref-project": mongoose.Schema.Types.DBRef,
  "ref-employee": mongoose.Schema.Types.DBRef,
  "ref-service": mongoose.Schema.Types.DBRef,
  date: { type: Date, required: true },
  quantity: { type: Number }
})

// TODO set indexes manually after adding option { autoIndex: false }
timesheetSchema.plugin(versioning, NAME + "s.versioning")

module.exports = mongoose.model(NAME, timesheetSchema)
