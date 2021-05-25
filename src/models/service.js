// imports
var mongoose = require('mongoose')
var versioning = require('../versioning/versioning')
mongoose.Promise = require('bluebird')

const NAME = "service"

// schema definition
var Schema = mongoose.Schema

let serviceSchema = new Schema({
  servno: { type: Number, required: true, unique: true },
  type : { type : String, required: true, default: "Stunde" },
  descr : { type : String, required: false },
  price: { type: Number, required: true }
  //  "ref-employee": { type: mongoose.Schema.Types.ObjectId, ref: 'employee'} 
})

// TODO set indexes manually after adding option { autoIndex: false }
serviceSchema.plugin(versioning, NAME + "s.versioning")

module.exports = mongoose.model(NAME, serviceSchema)
