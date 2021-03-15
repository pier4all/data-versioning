// entry point

// imports
// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })

var db = require('./db/database')

// read credentials
const mongodb_uri = process.env.DB_URI
const port = process.env.PORT || 3000

// content parser
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    var json = JSON.parse(body)
    done(null, json)
  } catch (err) {
    err.statusCode = 400
    done(err, undefined)
  }
})

// define routes
require("./routes/customer.routes")(fastify);


// Run the server!
const start = async () => {
  try {
    await db.connect(mongodb_uri)
    await fastify.listen(port)
  } catch (err) {
    fastify.log.error(err)
    endConnection()
    process.exit(1)
  }
}

const endConnection = async() => {
  await database.end()
  console.log("** finished ** " ); 
}; 

start()