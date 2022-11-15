// entry point

const db = require('./db/database')
var chalk = require('chalk');

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

    console.error(chalk.redBright(err))
    endConnection()
    process.exit(1)

  }
}

/* JCS: error in reference */
const endConnection = async() => {
  await db.end()
  console.log("** finished ** " )
}

start()
