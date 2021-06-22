var chalk = require('chalk');
const axios = require('axios');
var path = require('path');

const config_path = __dirname+'/../../config/.env'
require('dotenv').config({path: config_path})
const { ObjectID } = require('mongodb');

// Read input files
'use strict';
const fs = require('fs');
const COLLECTION = 'customer'

const generateRequest = (collection, id, version, endpoint='crud') => {

    var url = `${process.env.API_URL}:${process.env.PORT}/${endpoint}/${collection}`

    if (id) {
        if (version) return url + `/${id}/${version}`
        return url + `/${id}`
    }
    else return url
}

async function wait(ms = 5000) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

const run = async () => {

    var fileList = [
        path.join(__dirname, 'data', 'customer.json')
        // path.join(__dirname, 'data', 'customer_10000.json'),  
        // path.join(__dirname, 'data', 'customer_20000.json'),  
        // path.join(__dirname, 'data', 'customer_30000.json'),  
        // path.join(__dirname, 'data', 'customer_40000.json'),  
        // path.join(__dirname, 'data', 'customer_50000.json'),  
        // path.join(__dirname, 'data', 'customer_60000.json'),  
        // path.join(__dirname, 'data', 'customer_70000.json'),  
        // path.join(__dirname, 'data', 'customer_80000.json'),  
        // path.join(__dirname, 'data', 'customer_90000.json'),  
        // path.join(__dirname, 'data', 'customer_100000.json') 
    ]

    for (var file of fileList) {
        //read the docs
        console.log(chalk.cyan.bold("\n * Reading file: " + file))
        var rawdata = fs.readFileSync(file);
        let documents = JSON.parse(rawdata);
        console.log("\t - Read " + documents.length + " documents");

        var inserted = []

        // insert them
        var collection = COLLECTION 
        console.log("\t - Inserting at Collection '" + collection + "'");
        var url = generateRequest(collection)
        for(var document of documents) {
            try {
                // only for documents with dates or ids (fix for mongoose)
                Object.keys(document).forEach(function(key) {
                    var value = document[key]
                    var tags = ["$oid", "$date"]
                    tags.forEach( tag => {
                        if ((!!value) && (value.constructor === Object) 
                                      && (value.hasOwnProperty(tag))) {
                            document[key] = value[tag]
                        }
                    })
                }); 
                // ensure unique email
                if (document.email) {
                    document.email = document.email.split('@')[0] + document.custno + '@' + document.email.split('@')[1]
                }
                // post the insert
                var response = await axios.post(url, document);     
                inserted.push(response.data) 

            } catch (error) {
                console.error(chalk.redBright.bold(error.message));
                return
            }           
        }
        
        await wait()

        console.log("\t - Updating at Collection '" + collection + "'");
        for(var document of inserted) {
            await wait(100)
            try {
                // TODO for other types of documents
                var updated_document = { name: 'New '+ document.name }
                let id = document._id._id || document._id
                url = generateRequest(collection, id, 1)
                var response = await axios.patch(url, updated_document);     
            } catch (error) {
                console.error(chalk.redBright.bold(error.message));
                console.error(chalk.red(error));
                return
            }           
        }

        await wait()

        console.log("\t - Querying currently valid version at Collection '" + collection + "'");
        for(var document of inserted) {
            try {
                let id = document._id._id || document._id
                url = generateRequest(collection, id)
                var response = await axios.get(url);     
            } catch (error) {
                console.error(chalk.redBright.bold(error.message));
                return
            }           
        }

        await wait()

        console.log("\t - Querying past valid version at Collection '" + collection + "'");
        for(var document of inserted) {
            try {
                if (document._validity) {
                    var date = document._validity.start
                    let id = document._id._id || document._id
                    url = generateRequest(collection, id)
                    var response = await axios.get(url, {params: {date}});    
                } 
            } catch (error) {
                console.error(chalk.redBright.bold(error.message));
                return
            }           
        }

        await wait()

        console.log("\t - Querying current version at Collection '" + collection + "'");
        for(var document of inserted) {
            try {
                let id = document._id._id || document._id
                url = generateRequest(collection, id)
                var response = await axios.get(url + "/2");     
            } catch (error) {
                console.error(chalk.redBright.bold(error.message));
                return
            }           
        }

        await wait()

        console.log("\t - Querying previous version at Collection '" + collection + "'");
        for(var document of inserted) {
            try {
                let id = document._id._id || document._id
                url = generateRequest(collection, id)
                var response = await axios.get(url + "/1");     
            } catch (error) {
                console.error(chalk.redBright.bold(error.message));
                return
            }           
        }

        await wait()

        console.log("\t - Find by non indexed field at current collection '" + collection + "'");
        for(var document of inserted) {
            try {
                url = generateRequest(collection, 'find', undefined, endpoint='query')
                url += `?query="language": "${document.language}"`
                var response = await axios.get(url); 
            } catch (error) {
                console.error(chalk.redBright.bold(error.message));
                return
            }           
        }

        await wait()

        console.log("\t - Deleting from Collection '" + collection + "'");
        for(var document of inserted) {
            try {
                let id = document._id._id || document._id
                url = generateRequest(collection, id)
                var response = await axios.delete(url + '/2');     
            } catch (error) {
                console.error(chalk.redBright.bold(error.message));
                return
            }           
        }
    } 
}


run()