// entry point

// imports
// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })
require('dotenv').config()

var db = require('./src/database')
var eventController = require('./src/controllers/events.controller')

// read credentials
const mongodb_uri = process.env.DB_URI
const port = process.env.PORT || 3000

var database = new db.Database(mongodb_uri)

database.connect( (err, ok) => { 
  if (err) {
    console.error("Cannot connect to DB, exiting...")
    endConnection()
  } else {
    start()
  }
})

const endConnection = () => {
  database.end(() => { console.log("** finished ** " ); }
)}; 

// content parser
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    console.log("** PARSER **")
    console.log(body)
    var json = JSON.parse(body)
    done(null, json)
  } catch (err) {
    err.statusCode = 400
    done(err, undefined)
  }
})

// define routes
require("./src/routes/events.routes")(fastify);

// Run the server!
const start = async () => {
  try {
    await fastify.listen(port)
  } catch (err) {
    fastify.log.error(err)
    endConnection()
    process.exit(1)
  }
}
