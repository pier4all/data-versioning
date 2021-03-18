
const Customer = require("../models/customer");
const util = require('../versioning/util')
const c = require('../versioning/constants')
var chalk = require('chalk');
mongoose = require('mongoose')

exports.create = async (req, res) => {
  console.log(chalk.cyan("customer.controller.create: called create"))

  try {
    // Create an Customer
    const customer = new Customer(req.body);

    // Save Customer in the database
    await customer.save()
    res.status(201).send(customer);

  } catch (error) {

    console.error(error);
    res.status(500).send({
      message: "Some error occurred while creating the Customer.",
      exception: error.message
    });
  };
}

exports.update = async (req, res) => {

  let session
  let id

  try {
    console.log(chalk.cyan("customer.controller.update: called update"))

    // Validate request
    if (!req.body) {
      return res.status(400).send({ message: "Data to update can not be empty!" });
    }

    // Get the id
    id = req.params.id;
    
    // Update Customer in the database
    let customer = await Customer.findById(id)

    if (!customer) res.status(404).send({ message: "Not found Customer with id " + id });
    else {
      // TODO: review this with Jean-Claude regarding the versioning fields
      for (var key in req.body) {
          if (req.body.hasOwnProperty(key)) {
              customer[key] = req.body[key]
          }
      }

      // start transaction
      session = await mongoose.startSession();
      session.startTransaction();

      // store _session in document
      customer[c.SESSION] = session

      await customer.save({session})   

      // commit transaction
      await session.commitTransaction();
      session.endSession();
      console.log(chalk.greenBright("-- commit transaction --"))

      // return result
      res.status(200).send(customer);
      // TODO consider alternative status 204 with no data
    }
  } catch(error) {
    if (session) {
      session.endSession();
      console.log(chalk.redBright("-- ABORT transaction --"))
    }
    console.error(error.message);
    res.status(500).send({
      message: "Error occurred while updating the Customer with id=" + id,
      exception:  error.message
    });
  }
}

exports.delete = async (req, res) => {
  console.log(chalk.cyan("customer.controller.delete: called delete"))

  let session
  let id

  try {
     // Get the id
    id = req.params.id;
    console.log(chalk.blue(id))
  
    // Delete Customer in the database
    let customer = await Customer.findById(id)
    if (!customer)
        res.status(404).send({ message: "Not found Customer with id " + id });
    else {
      // set the deletion info
      customer[c.DELETION] = req.body || {}

      // start transaction
      session = await mongoose.startSession();
      session.startTransaction();

      // store _session in document
      customer[c.SESSION] = session

      let data = await customer.remove({session})    
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
        .send({ message: "Error deleting Customer with id=" + id });
  }
}
  
exports.findValidVersion = async(req, res) => {
  // TODO: maybe accept a date range too
  console.log(chalk.cyan("customer.controller.queryCustomer: called findValidVersion"))

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
          .send({ message: "Invalid date provided " + req.query.date });
      return;    
    }

    let customer = await Customer.findValidVersion(id, date, Customer)
    if (!customer) res.status(404).send({ message: "Not found Customer with id " + id });
    else res.send(customer);

  } catch(error) {
    console.error(error);
    res
        .status(500)
        .send({ message: "Error retrieving Customer with id=" + id,
                exception: error.message });
  };
};

exports.findVersion = async(req, res) => {
  console.log(chalk.cyan("customer.controller.queryCustomer: called findVersion"))

  let id
  let version

  try {
    id = req.params.id;
    version = req.params.version;

    if (!util.isValidVersion(version)) {
      console.error("Bad version provided");
      res
          .status(400)
          .send({ message: "Invalid version provided " + version });
      return;    
    }

    let customer = await Customer.findVersion(id, parseInt(version), Customer)
    if (!customer) res.status(404).send({ message: "Not found Customer with id " + id });
    else res.send(customer);

  } catch(error) {
    console.error(error);
    res
        .status(500)
        .send({ message: "Error retrieving Customer with id=" + id,
                exception: error.message });
  };
};

exports.findAll = async (req, res) => {
  
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    console.log(chalk.cyan("customer.controller.queryCustomer: called findAll, limit=" + limit + ", offset=" + offset))

    let customers = await Customer.find({}, null, { sort: { _id: 1 } }).skip(offset).limit(limit)

    if (!customers) res.status(404).send({ message: "Not found Customers" });
    else res.send(customers);
        
  } catch (error) {
    console.error(error);
    res
        .status(500)
        .send({ message: "Error retrieving Customers" });
  };
};

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}


