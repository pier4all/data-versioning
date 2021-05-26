const chalk = require('chalk')

const processError = (res, error, message) => {
    // Log the error
    console.log(chalk.redBright.bold(error.message))

    // set initial response object
    let responseError = {
      message,
      details: error.message
    }

    switch(error.name) {
      // Check if it is a mongoDB error
      case "MongoError":
        if (error.code === 11000)
          return res.status(400).send(responseError)
      
      // Check if it is a mongoose validation error
      case "ValidationError":
        return res.status(400).send(responseError)

      case "Error":
       // Check if it is requesting on a non-existing colleciton
        if (error.code === "MODULE_NOT_FOUND") {
          responseError.details = "Collection does not exist."
          return res.status(400).send(responseError)
        } else {
          // Check if the error comes from bad request parameters
          if (error.code === "BAD_PARAMETER") 
            return res.status(400).send(responseError)
        }

      // Check if the error comes from bad parameters (type)
      case "TypeError":
        return res.status(400).send(responseError)
    }

    return res.status(500).send(responseError)
  }

  module.exports = { processError }
