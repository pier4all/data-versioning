// imports
var mongoose = require('mongoose');
var transverse = require('../versioning/versioning');
mongoose.Promise = require('bluebird');

// schema definition
var Schema = mongoose.Schema;

let eventsSchema = new Schema({
  title : { type : String, required : true },
  status : { type : String, required : true },
  tags : [ String ],
  priority: { type: Number }
});

// TODO set indexes manually after adding option { autoIndex: false }
eventsSchema.plugin(transverse, "events.versioning");

module.exports = mongoose.model('event', eventsSchema);
