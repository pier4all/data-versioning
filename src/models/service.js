// imports
const mongoose = require('mongoose')
const versioning = require('../versioning/versioning')
mongoose.Promise = require('bluebird')

const NAME = "service"

// schema definition
let Schema = mongoose.Schema

let serviceSchema = new Schema({
  servno: { type: Number, required: true, unique: false },
  type : { type : String, required: true, default: "Stunde" },
  descr : { type : String, required: false },
  price: { type: Number, required: true }
  //  "ref-employee": { type: mongoose.Schema.Types.ObjectId, ref: 'employee'} 
})

// TODO set indexes manually after adding option { autoIndex: false }
serviceSchema.plugin(versioning, {collection: NAME + "s.versioning", mongoose})

module.exports = mongoose.model(NAME, serviceSchema)
