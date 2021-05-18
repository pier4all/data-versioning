// imports
const mongoose = require('mongoose')
const versioning = require('mongoose-versioned/source/versioning')
mongoose.Promise = require('bluebird')

const NAME = "employee"

// schema definition
let Schema = mongoose.Schema

let employeeSchema = new Schema({
  empno: { type: Number, required: true, unique: true },
  svn : { type : String, required: true, unique: true },
  lastname: { type: String, required: true },
  firstname: { type: String, required: true },
  pensum: { type: String, required: true, default: "100%"}
})

// TODO set indexes manually after adding option { autoIndex: false }
<<<<<<< HEAD
employeeSchema.plugin(versioning, {collection: NAME + "s.versioning", mongoose})
=======
// employeeSchema.plugin(versioning, NAME + "s.versioning");
>>>>>>> ea60771 (first working version)

module.exports = mongoose.model(NAME, employeeSchema)
