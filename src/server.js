// entry point

var db = require('./db/database')

// read credentials
const result = require('dotenv').config({ path: 'config/.env' })

if (result.error) {
  throw result.error
}
console.log(result.parsed)

const mongodb_uri = process.env.DB_URI
const port = process.env.PORT || 3000

'use strict'

const app = require('./app')({
  logger: {
    level: 'info'
  }
})

// Run the server!
const start = async () => {
  try {

    await db.connect(mongodb_uri)
    await app.listen(port)

  } catch (err) {

    fastify.log.error(err)
    endConnection()
    process.exit(1)

  }
}

/* JCS: error in reference */
const endConnection = async() => {
  await db.end() //database.end()
  console.log("** finished ** " );
};

start()
