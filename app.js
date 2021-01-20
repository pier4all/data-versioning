// entry point

// imports
require('dotenv').config()

var mongoose = require('mongoose');
var vermongo = require('mongoose-vermongo');
mongoose.Promise = require('bluebird');

// read credentials
const mongodb_uri = process.env.DB_URI

// start schema
var Schema = mongoose.Schema;
 
var pageSchema = new Schema({
  title : { type : String, required : true},
  content : { type : String, required : true },
  path : { type : String, required : true},
  tags : [String],
 
  lastModified : Date,
  created : Date
});
pageSchema.plugin(vermongo, "pageschemas.vermongo");
 
mongoose.connect(mongodb_uri);
mongoose.connection.on('error', () => {
    console.log(`MongoDB connection error. Please make sure MongoDB is running.`);
    console.log(`MongoDB URI: ` + mongodb_uri);
    process.exit();
});
 
mongoose.connection.on('connected', () => {
  const Page = mongoose.model('PageSchema', pageSchema);
  var page = new Page({ title: "test", content: "foobar", path: "lala", tags: ["a", "b"] });
  page.save()
    .then((page) => { page.title = "test 2"; return page.save(); })
    .then((page) => { return page.remove(); })
    .then((page) => { process.exit(); })
    .catch((err) => { console.log(err); process.exit(); })
});
