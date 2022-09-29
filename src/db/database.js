const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const chalk = require('chalk')

exports.connect =  async (mongodb_uri) => {
    console.log(chalk.yellow("Database.connect: DB connecting (" + mongodb_uri + ") ... "))
    try {
        await mongoose.connect(mongodb_uri, { useUnifiedTopology: true, useNewUrlParser: true, autoIndex: false  })
        mongoose.set('debug', true);
        console.log(chalk.green.bold("Database.connect: DB connected "))
    } catch (err) {
        console.error(`Database.connect: MongoDB connection error. Please make sure MongoDB is running: ` + err.message)
        throw new Error(err)
    }
}

exports.end = async() => {
    console.log(chalk.red("Database.end: DB closing..."))
    await mongoose.connection.close()
    console.log(chalk.red.bold("Database.end: DB disconnected "))
}
