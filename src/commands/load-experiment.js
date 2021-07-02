const db = require('../db/database')
const res_dotenv = require('dotenv').config({ path: '../../config/.env' })
const mongodb_uri = process.env.DB_URI
const mongoose = require("mongoose")
const Model = require(`../models/customer`)
var chalk = require('chalk');
var path = require('path');
const fs = require('fs');
const NS_PER_SEC = 1e9

// mongoose.set('debug', true);


async function wait(ms = 5000) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

const saveAction = async(data) => {

    let session

    delete data._id;

    try {
        session = await mongoose.startSession()
        session.startTransaction()

        const document = new Model(data)

        // fix email
        if (document.email) {
            document.email = document.email.split('@')[0] + document.custno + '@' + document.email.split('@')[1]
        }

        const saved = await document.save(data)

        session.commitTransaction()
        session.endSession()

        return saved

    } catch (error) {
        console.log(chalk.redBright(`* error * ${error}`))
        return undefined
    }
}

const updateAction = async(data) => {

    let session

    if (data == undefined){
        return undefined
    }

    try {
        session = await mongoose.startSession()
        session.startTransaction()

        data.name = 'New '+ data.name 
        const saved = await data.save()

        session.commitTransaction()
        session.endSession()

        return saved

    } catch (error) {
        console.log(chalk.redBright(`* error * ${error}`))
        return undefined
    }
}

const run = async () => {

    // const file = path.join(__dirname, 'data', 'customer.json')
    // const file = path.join(__dirname, 'data', 'customer_with_errors.json')
    const file = path.join(__dirname, 'data', 'customer_10000.json')
        
    console.log(chalk.cyan.bold("\n * Reading file: " + file))
    var rawdata = fs.readFileSync(file);
    let documents = JSON.parse(rawdata);
    console.log("\t - Read " + documents.length + " documents");

    await db.connect(mongodb_uri)
    
    // wait to create indexes
    await wait()

    // start timer
    const start = process.hrtime()

    // parallel inserts
    let actions = documents.map(saveAction)
    const saved = await Promise.all(actions)

    const failed_inserts = saved.filter(item => item == undefined).length
    console.log("\t - Performed " + saved.length + " inserts, failed " + failed_inserts);

    // parallel updates
    actions = saved.map(updateAction)
    const updated = await Promise.all(actions)

    const failed_updates = updated.filter(item => item == undefined).length
    console.log("\t - Performed " + updated.length + " updates, failed " + failed_updates);

    const diff = process.hrtime(start)
    const time = `${(diff[0] * NS_PER_SEC + diff[1])/1e6}`

    console.log(`DOME, took ${time} ms`);

    
    await db.end()

}

run()
