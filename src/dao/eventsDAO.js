// imports
var chalk = require('chalk');
var mongoose = require('mongoose');
var vermongo = require('mongoose-vermongo');
mongoose.Promise = require('bluebird');

// schema definition
var Schema = mongoose.Schema;

const eventsSchema = new Schema({
  title : { type : String, required : true},
  status : { type : String, required : true },
  tags : [String],
 
  lastModified : Date,
  created : Date,
  deleted : Date
});

let db_uri

class EventsDAO {

  init(mongodb_uri, callback) {

    db_uri = mongodb_uri
    eventsSchema.plugin(vermongo, "events.vermongo");
    this.connect(callback)
  }

  connect(callback) {

    mongoose.connect(db_uri, {useUnifiedTopology: true, useNewUrlParser: true});
    console.log(chalk.yellow("EventsDAO.connect: DB connecting ... "));

    mongoose.connection.on('error', () => {
      console.log(`EventsDAO.connect: MongoDB connection error. Please make sure MongoDB is running. MongoDB URI: ` + db_uri);
    });

    mongoose.connection.on('connected', () => {
      console.log(chalk.green.bold("EventsDAO.connect: DB connected "));
      callback();
    });
  }

  end(callback){
    mongoose.connection.close()
    console.log(chalk.red("EventsDAO.end: DB closing..."));

    mongoose.connection.on('disconnected', () => {
      console.log(chalk.red.bold("EventsDAO.end: DB disconnected "));
      callback();
    });
  }

  createEvent(data, callback) {
    console.log("EventsDAO.createEvent: connected, creating event")
    console.log(mongoose.connection.readyState)

    const Event = mongoose.model('event', eventsSchema);
    var event = new Event(data);
    event.save().then((event) => { callback(event); }).catch((err) => { console.log(err); process.exit(); })
  }

  updateEvent(event, callback) {
    console.log("EventsDAO.updateEvent: called update new model")
    console.log(mongoose.connection.readyState)
    event.save()
          .then((event) => { callback(event); })
          .catch((err) => { console.log(err); process.exit(); })
  }


  queryEvent(query, callback) {
    console.log("EventsDAO.queryEvent: called query event")
    console.log(query)

    console.log(mongoose.connection.readyState)
    if (mongoose.connection.readyState == 1) {
      const Event = mongoose.model('event', eventsSchema);
      Event.findOne(query, function (err, found_event) { console.log("EventsDAO.queryEvent: found: \n" + found_event); callback(query)});
    }
  }

}
 
module.exports.EventsDAO = EventsDAO




