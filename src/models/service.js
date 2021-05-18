// imports
<<<<<<< HEAD
const mongoose = require('mongoose')
const versioning = require('mongoose-versioned/source/versioning')
mongoose.Promise = require('bluebird')
=======
var mongoose = require('mongoose');
// var versioning = require('../versioning/versioning');
mongoose.Promise = require('bluebird');
>>>>>>> ea60771 (first working version)

const NAME = "service"

// schema definition
let Schema = mongoose.Schema

let serviceSchema = new Schema({
  servno: { type: Number, required: true, unique: true },
  type : { type : String, required: true, default: "Stunde" },
  descr : { type : String, required: false },
  price: { type: Number, required: true }
  //  "ref-employee": { type: mongoose.Schema.Types.ObjectId, ref: 'employee'} 
})

// TODO set indexes manually after adding option { autoIndex: false }
<<<<<<< HEAD
serviceSchema.plugin(versioning, {collection: NAME + "s.versioning", mongoose})
=======
// serviceSchema.plugin(versioning, NAME + "s.versioning");
>>>>>>> ea60771 (first working version)

module.exports = mongoose.model(NAME, serviceSchema)
