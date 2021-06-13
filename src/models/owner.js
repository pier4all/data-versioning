// imports
const mongoose = require('mongoose')
const uuid = require('node-uuid')
const versioning = require('mongoose-versioned/source/versioning')
mongoose.Promise = require('bluebird')

const NAME = "owner"

// schema definition
let Schema = mongoose.Schema

let ownersSchema = new Schema({
  name : { type : String, required : true },
  country : { type : String, default: "CH" },
  address : { street: { type: String },
              zip: { type: String },
              city: { type: String }
            },
  uuid: { type : String, required : true, default: uuid.v4 },
  taxType : { type : String },
  currency : { type : String, default: "CHF" }
})

// TODO set indexes manually after adding option { autoIndex: false }
ownersSchema.plugin(versioning, {collection: NAME + "s.versioning", mongoose})

module.exports = mongoose.model(NAME, ownersSchema)
