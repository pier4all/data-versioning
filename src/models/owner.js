// imports
var mongoose = require('mongoose');
var uuid = require('node-uuid');
var transverse = require('../versioning/versioning');
mongoose.Promise = require('bluebird');

const NAME = "owner"

// schema definition
var Schema = mongoose.Schema;

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
});

// TODO set indexes manually after adding option { autoIndex: false }
ownersSchema.plugin(transverse, NAME + "s.versioning");

module.exports = mongoose.model(NAME, ownersSchema);
