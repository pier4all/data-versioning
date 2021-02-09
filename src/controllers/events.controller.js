
const Event = require("../models/events");
var chalk = require('chalk');

exports.create = (req, res) => {
    console.log(chalk.cyan("event.controller.create: called create"))

  // Validate request
  if (!req.body.title) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }

  // Create an Event
  let now = new Date()
  const event = new Event({
    title: req.body.title,
    status: req.body.status,
    tags: req.body.tags,
    created: req.body.created ? req.body.created : now,
    modified: req.body.modified 
  });

  // Save Event in the database
  event
    .save(event)
    .then(data => {
      res.status(201).send(data);
    })
    .catch(err => {
    console.error(err);
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Event."
      });
    });

}

// exports.update = (event, callback) => {
//     console.log("event.controller.update: called update new model")
//     event.save()
//         .then((event) => { callback(event); })
//         .catch((err) => { console.log(err); process.exit(); })
// }

exports.findOne = (req, res) => {
    console.log(chalk.cyan("event.controller.queryEvent: called findOne"))

    const id = req.params.id;
    
    Event.findById(id)
        .then(data => {
        if (!data)
            res.status(404).send({ message: "Not found Event with id " + id });
        else res.send(data);
        })
        .catch(err => {
            console.error(err);
            res
                .status(500)
                .send({ message: "Error retrieving Event with id=" + id });
        });
};

exports.findAll = (req, res) => {

    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    console.log(chalk.cyan("event.controller.queryEvent: called findAll, limit=" + limit + ", offset=" + offset))

    Event.find({}, null, {sort: {_id: 1}}).skip(offset).limit(limit).then(data => {
            if (!data)
                res.status(404).send({ message: "Not found Events" });
            else res.send(data);
        })
        .catch(err => {
            console.error(err);
            res
                .status(500)
                .send({ message: "Error retrieving Events" });
        });
};
      
