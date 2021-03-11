// imports
var mongoose = require('mongoose');
var transverse = require('../versioning/versioning');
mongoose.Promise = require('bluebird');

const NAME = "service"

// schema definition
var Schema = mongoose.Schema;

let serviceSchema = new Schema({
  type : { type : String, required: true, default: "Stunde" },
  price: [ { value: { type: Number, required: true },
             "ref-employee": { type: mongoose.Schema.Types.ObjectId, ref: 'employee'} 
  } ]
});

// TODO set indexes manually after adding option { autoIndex: false }
serviceSchema.plugin(transverse, NAME + "s.versioning");

module.exports = mongoose.model(NAME, serviceSchema);
