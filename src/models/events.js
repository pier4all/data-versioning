// imports
var mongoose = require('mongoose');
var transverse = require('../versioning/transverse');
mongoose.Promise = require('bluebird');

// schema definition
var Schema = mongoose.Schema;

let eventsSchema = new Schema({
  title : { type : String, required : true },
  status : { type : String, required : true },
  tags : [ String ],
  priority: { type: Number }
});

eventsSchema.plugin(transverse, "events.versioning");

module.exports = mongoose.model('event', eventsSchema);
