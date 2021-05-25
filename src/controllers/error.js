const chalk = require('chalk')

const processError = (res, error, message) => {
    // Log the error
    console.error(error)
    console.log(chalk.redBright.bold(error.message))

    // set initial response object
    let responseError = {
      message,
      details: error.message
    }

    /* JCS: tighten logic */
    // Check if it is a mongoDB error
    if (error.name == "MongoError") 
      if (error.code == 11000)
        return res.status(400).send(responseError)
    
    // Check if it is a mongoose validation error
    if (error.name == "ValidationError") 
      return res.status(400).send(responseError)

    // Check if it is requesting on a non-existing colleciton
    if (error.name == "Error" && error.code=="MODULE_NOT_FOUND") {
      responseError.details = "Collection does not exist. "
      return res.status(400).send(responseError)
    }

    // Check if the error comes from bad request parameters
    if ((error.name == "Error" && error.code=="BAD_PARAMETER") ||
        (error.name == "TypeError"))
      return res.status(400).send(responseError)

    return res.status(500).send(responseError)
  }

  module.exports = { processError }
