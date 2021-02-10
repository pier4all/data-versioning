
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

exports.update = (req, res) => {
  console.log(chalk.cyan("event.controller.update: called update"))

  // Validate request
  if (!req.body) {
    return res.status(400).send({ message: "Data to update can not be empty!" });
  }

  // Get the id
  const id = req.params.id;
  console.log(chalk.blue(id))

  // Update Event in the database
  Event.findById(id)
  .then(event => {
  if (!event)
      res.status(404).send({ message: "Not found Event with id " + id });
  else {

    for (var key in req.body) {
        if (req.body.hasOwnProperty(key)) {
            event[key] = req.body[key]
        }
    }
    event.modified = req.body.modified ? req.body.modified :  new Date()

    event.save()    
    .then(data => {
        res.status(200).send(data);
        // alternative status 204 with no data
      })
      .catch(err => {
      console.error(err);
        res.status(500).send({
          message: "Error occurred while updating the Event with id=" + id 
        });
      });
    }
  })
  .catch(err => {
      console.error(err);
      res
          .status(500)
          .send({ message: "Error retrieving Event with id=" + id });
  });

}

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

exports.delete = (req, res) => {
    console.log(chalk.cyan("event.controller.delete: called delete"))
  
     // Get the id
    const id = req.params.id;
    console.log(chalk.blue(id))
  
    // Delete Event in the database
    Event.findById(id)
    .then(event => {
    if (!event)
        res.status(404).send({ message: "Not found Event with id " + id });
    else {
        event.remove()    
        .then(data => {
            res.status(200).send(data);
            // alternative status 204 with no data
        })
        .catch(err => {
        console.error(err);
            res.status(500).send({
            message: "Error occurred while deleting the Event with id=" + id 
            });
        });
        }
    })
    .catch(err => {
        console.error(err);
        res
            .status(500)
            .send({ message: "Error retrieving Event with id=" + id });
    });
  
  }
  
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
      
