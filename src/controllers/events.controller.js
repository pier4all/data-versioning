
const Event = require("../models/events");
var chalk = require('chalk');
mongoose = require('mongoose')

exports.create = async (req, res) => {
  console.log(chalk.cyan("event.controller.create: called create"))

  // Validate request
  if (!req.body.title) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }

  try {
    // Create an Event
    const event = new Event(req.body);

    // Save Event in the database
    await event.save()
    res.status(201).send(event);

  } catch (error) {

    console.error(error);
    res.status(500).send({
      message: "Some error occurred while creating the Event.",
      exception: error.message
    });
  };
}

exports.update = async (req, res) => {

  let session
  let id

  try {
    console.log(chalk.cyan("event.controller.update: called update"))

    // Validate request
    if (!req.body) {
      return res.status(400).send({ message: "Data to update can not be empty!" });
    }

    // Get the id
    id = req.params.id;
    
    // Update Event in the database
    let event = await Event.findById(id)

    if (!event) res.status(404).send({ message: "Not found Event with id " + id });
    else {
      // TODO: review this with Jean-Claude regarding the versioning fields
      for (var key in req.body) {
          if (req.body.hasOwnProperty(key)) {
              event[key] = req.body[key]
          }
      }

      // start transaction
      session = await mongoose.startSession();
      session.startTransaction();

      // store _session in document
      event._session = session

      await event.save({session})   

      // commit transaction
      await session.commitTransaction();
      session.endSession();
      console.log(chalk.greenBright("-- commit transaction --"))

      // return result
      res.status(200).send(event);
      // TODO consider alternative status 204 with no data
    }
  } catch(error) {
    if (session) {
      session.endSession();
      console.log(chalk.redBright("-- ABORT transaction --"))
    }
    console.error(error.message);
    res.status(500).send({
      message: "Error occurred while updating the Event with id=" + id,
      exception:  error.message
    });
  }
}

exports.delete = async (req, res) => {
  console.log(chalk.cyan("event.controller.delete: called delete"))

  let session
  let id

  try {
     // Get the id
    id = req.params.id;
    console.log(chalk.blue(id))
  
    // Delete Event in the database
    let event = await Event.findById(id)
    if (!event)
        res.status(404).send({ message: "Not found Event with id " + id });
    else {
      // set the deltion info
      event._deletion = req.body || {}

      // start transaction
      session = await mongoose.startSession();
      session.startTransaction();

      // store _session in document
      event._session = session

      let data = await event.remove({session})    
      res.status(200).send(data);
      // alternative status 204 with no data

      // commit transaction
      await session.commitTransaction();
      session.endSession();
      console.log(chalk.greenBright("-- commit transaction --"))
    
    }
  } catch(error) {
    if (session) {
      session.endSession();
      console.log(chalk.redBright("-- ABORT transaction --"))
    }
    console.error(error);
    res
        .status(500)
        .send({ message: "Error deleting Event with id=" + id });
  }
}
  
exports.findValidVersion = async(req, res) => {
  // TODO: maybe accept a date range too
  console.log(chalk.cyan("event.controller.queryEvent: called findValidVersion"))

  let id
  let date
  try {
    
    // Get request parameters
    id = req.params.id;
    
    if(req.query.date) {
      date = new Date(req.query.date)
    }
    else {
      date = new Date()
    }

    if (!isValidDate(date)) {
      console.error("Bad date provided");
      res
          .status(400)
          .send({ message: "Ivalid date provided " + req.query.date });
      return;    
    }

    let event = await Event.findValidVersion(id, date, Event)
    if (!event) res.status(404).send({ message: "Not found Event with id " + id });
    else res.send(event);

  } catch(error) {
    console.error(error);
    res
        .status(500)
        .send({ message: "Error retrieving Event with id=" + id,
                exception: error.message });
  };
};

exports.findVersion = async(req, res) => {
  console.log(chalk.cyan("event.controller.queryEvent: called findVersion"))

  let id
  let version

  try {
    id = req.params.id;
    version = req.params.version;

    if (!isValidVersion(version)) {
      console.error("Bad version provided");
      res
          .status(400)
          .send({ message: "Ivalid version provided " + version });
      return;    
    }

    let event = await Event.findVersion(id, parseInt(version), Event)
    if (!event) res.status(404).send({ message: "Not found Event with id " + id });
    else res.send(event);

  } catch(error) {
    console.error(error);
    res
        .status(500)
        .send({ message: "Error retrieving Event with id=" + id,
                exception: error.message });
  };
};

exports.findAll = async (req, res) => {
  
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    console.log(chalk.cyan("event.controller.queryEvent: called findAll, limit=" + limit + ", offset=" + offset))

    let events = await Event.find({}, null, { sort: { _id: 1 } }).skip(offset).limit(limit)

    if (!events) res.status(404).send({ message: "Not found Events" });
    else res.send(events);
        
  } catch (error) {
    console.error(error);
    res
        .status(500)
        .send({ message: "Error retrieving Events" });
  };
};

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

function isValidVersion(v) {
  if (typeof v != "string") return false // we only process strings!  
  if (isNaN(v)) return false // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
  if (isNaN(parseInt(v))) return false// ...and ensure strings of whitespace fail
  if (parseInt(v) < 1) return false
  return true
}

