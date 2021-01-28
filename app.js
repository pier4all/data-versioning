// entry point

// imports
require('dotenv').config()

var eventsDAO = require('./src/dao/eventsDAO.js');

// read credentials
const mongodb_uri = process.env.DB_URI

// eventsDAO
var eventsDAO = require('./src/dao/eventsDAO.js');
const eventDAO = new eventsDAO.EventsDAO();

const afterUpdate = (event) => {
  eventDAO.end(() => { console.log("** finished update ** " + event.title); }
)};

const afterCreate = (event) => {
  
  event.status = "DELIVERY"; 
  event.lastModified = new Date(); 

  console.log("** finished creation ** " + event.title)  
  eventDAO.updateEvent(event, afterUpdate);
  
};

eventDAO.init(mongodb_uri, () => {
  eventDAO.createEvent({title: "test A", status: "PENDING", tags: ["mongodb", "versioning"], created: new Date()}, afterCreate);
});




//.then((page) => { page.title = "test 2"; page.content = "updating a document"; page.lastModified = new Date(); return page.save(); })
// .then((page) => { page.title = "test 3"; page.content = "updating a document again"; page.lastModified = new Date(); return page.save(); })
// .then((page) => { page.deleted = new Date(); return page.remove(); })
// .then((page) => { process.exit(); })
// .catch((err) => { console.log(err); process.exit(); });

// var page2 = new Page({ title: "another", content: "new object", tags: ["mongodb", "mongoose"], created: new Date()});
// page2.save()
// .then((page2) => { page2.title = "another 2"; page2.content = "updated object"; page2.lastModified = new Date(); return page2.save(); })
// .then((page2) => { process.exit(); })
// .catch((err) => { console.log(err); process.exit(); });


// start schema
// var Schema = mongoose.Schema;
 
// var pageSchema = new Schema({
//   title : { type : String, required : true},
//   content : { type : String, required : true },
//   tags : [String],
 
//   lastModified : Date,
//   created : Date,
//   deleted : Date
// });

// pageSchema.plugin(vermongo, "pageschemas.vermongo");
 
// mongoose.connect(mongodb_uri);
// mongoose.connection.on('error', () => {
//   console.log(`MongoDB connection error. Please make sure MongoDB is running.`);
//   console.log(`MongoDB URI: ` + mongodb_uri);
//   process.exit();
// });

// mongoose.connection.on('connected', () => {
//   const Page = mongoose.model('PageSchema', pageSchema);
//   var page = new Page({ title: "test", content: "creating a document", tags: ["mongodb", "versioning"], created: new Date()});
//   page.save()
//   .then((page) => { page.title = "test 2"; page.content = "updating a document"; page.lastModified = new Date(); return page.save(); })
//   .then((page) => { page.title = "test 3"; page.content = "updating a document again"; page.lastModified = new Date(); return page.save(); })
//   .then((page) => { page.deleted = new Date(); return page.remove(); })
//   .then((page) => { process.exit(); })
//   .catch((err) => { console.log(err); process.exit(); });

//   var page2 = new Page({ title: "another", content: "new object", tags: ["mongodb", "mongoose"], created: new Date()});
//   page2.save()
//   .then((page2) => { page2.title = "another 2"; page2.content = "updated object"; page2.lastModified = new Date(); return page2.save(); })
//   .then((page2) => { process.exit(); })
//   .catch((err) => { console.log(err); process.exit(); });

// });

