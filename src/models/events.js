// imports
var mongoose = require('mongoose');
var vermongo = require('mongoose-vermongo');
mongoose.Promise = require('bluebird');

// schema definition
var Schema = mongoose.Schema;

let eventsSchema = new Schema({
  title : { type : String, required : true},
  status : { type : String, required : true },
  tags : [String],
 
  modified : Date,
  created : Date,
  deleted : Date
});

eventsSchema.plugin(vermongo, "events.vermongo");

module.exports = mongoose.model('event', eventsSchema);




