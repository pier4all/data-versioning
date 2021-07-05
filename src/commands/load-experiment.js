const db = require('../db/database')
const res_dotenv = require('dotenv').config({ path: '../../config/.env' })
const mongodb_uri = process.env.DB_URI
const mongoose = require("mongoose")
const Model = require(`../models/customer`)
var chalk = require('chalk');
var path = require('path');
const fs = require('fs');
const NS_PER_SEC = 1e9
const constants = require('mongoose-versioned/source/constants')

// mongoose.set('debug', true);

function compare(a, b) {
    if (a.custno < b.custno) {
        return -1;
    }
    if (a.custno > b.custno) {
        return 1;
    }
    // a must be equal to b
    return 0;
}

async function wait(ms = 5000) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

const saveAction = async(data) => {

    let session

    delete data._id;

    try {
        const document = new Model(data)

        // fix email
        if (document.email) {
            document.email = document.email.split('@')[0] + document.custno + '@' + document.email.split('@')[1]
        }

        const saved = await document.save(data)

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

        // store _session in document and save
        data[constants.SESSION] = session

        data.name = 'New '+ data.name 
        const saved = await data.save({session})

        await session.commitTransaction()
        session.endSession()

        return saved

    } catch (error) {
        console.log(chalk.redBright(`* error * ${error}`))
        return undefined
    }
}


function get_random (list) {
    return list[Math.floor((Math.random()*list.length))];
}

const updateRandom = async(documents) => {

    let session

    const document = get_random(documents)

    try {

        const data = await Model.findById(document._id)

        session = await mongoose.startSession()
        session.startTransaction()

        // store _session in document and save
        data[constants.SESSION] = session

        data.name = 'ASYNC '+ data.name 
        const saved = await data.save({session})

        await session.commitTransaction()
        session.endSession()

        return saved

    } catch (error) {
        console.log(chalk.redBright(`* error * ${error}`))
        return undefined
    }
}

const run = async () => {

    //const files = [path.join(__dirname, 'data', 'customer.json')]
    // const files = [path.join(__dirname, 'data', 'customer_with_errors.json')]
    const files = [
        path.join(__dirname, 'data', 'customer_10000.json'),
        path.join(__dirname, 'data', 'customer_20000.json'),
        path.join(__dirname, 'data', 'customer_30000.json')
        // path.join(__dirname, 'data', 'customer_40000.json'),
        // path.join(__dirname, 'data', 'customer_50000.json'),
        // path.join(__dirname, 'data', 'customer_60000.json'),
        // path.join(__dirname, 'data', 'customer_70000.json'),
        // path.join(__dirname, 'data', 'customer_80000.json'),
        // path.join(__dirname, 'data', 'customer_90000.json'),
        // path.join(__dirname, 'data', 'customer_100000.json')
    ]

    let documents = []
    for (const file of files){
        console.log(chalk.cyan.bold("\n * Reading file: " + file))
        var rawdata = fs.readFileSync(file);
        documents = documents.concat(JSON.parse(rawdata));
    }
    console.log("\t - Read " + documents.length + " documents");
    await db.connect(mongodb_uri)
    
    // wait to create indexes
    await wait()

    // parallel inserts
    let actions = documents.map(saveAction)

    // start timer
    const start_insert = process.hrtime()

    const saved = await Promise.all(actions)

    // end timer
    const diff_insert = process.hrtime(start_insert)
    const time_insert = `${(diff_insert[0] * NS_PER_SEC + diff_insert[1])/1e6}`
    console.log(`DONE inserts, took ${time_insert} ms`);

    const failed_inserts = saved.filter(item => item == undefined).length
    console.log("\t - Performed " + saved.length + " inserts, failed " + failed_inserts);

    // parallel updates
    let inserted_docs = await Model.find()
    actions = inserted_docs.map(updateAction)

    // start timer
    const start_update = process.hrtime()

    const updated = await Promise.all(actions)

    // end timer
    const diff_update = process.hrtime(start_update)
    const time_update = `${(diff_update[0] * NS_PER_SEC + diff_update[1])/1e6}`
    console.log(`DONE updates, took ${time_update} ms`);

    const failed_updates = updated.filter(item => item == undefined).length
    console.log("\t - Performed " + updated.length + " updates, failed " + failed_updates);

    // // crazy updates
    // for (var i = 0; i <= updated.length * 100; i++) {
    //     updateRandom(updated);
    // }

    // disconnect db
    await db.end()

}

run()
