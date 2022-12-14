var chalk = require('chalk');
const axios = require('axios');
var path = require('path');

const config_path = __dirname+'/../../config/.env'
require('dotenv').config({path: config_path})
const { ObjectID } = require('mongodb');

// Read input files
'use strict';
const fs = require('fs');

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

  function parseDocument(line) {

    let document = JSON.parse(line)

    return document
  }

const run = async () => {

    // Batch 1M
    var fileList = [
        // path.join(__dirname, 'data', 'employee.json')
        // path.join(__dirname, 'data', 'employee_1000.json')
        path.join(__dirname, 'data', 'batch_100K', 'employee_10000.json'),  
        path.join(__dirname, 'data', 'batch_100K', 'employee_20000.json'),  
        path.join(__dirname, 'data', 'batch_100K', 'employee_30000.json'),  
        path.join(__dirname, 'data', 'batch_100K', 'employee_40000.json'),  
        path.join(__dirname, 'data', 'batch_100K', 'employee_50000.json'),  
        path.join(__dirname, 'data', 'batch_100K', 'employee_60000.json'),  
        path.join(__dirname, 'data', 'batch_100K', 'employee_70000.json'),  
        path.join(__dirname, 'data', 'batch_100K', 'employee_80000.json'),  
        path.join(__dirname, 'data', 'batch_100K', 'employee_90000.json'),  
        path.join(__dirname, 'data', 'batch_100K', 'employee_100000.json') 
    ]

    const COLLECTION = 'employee'

    const BATCH_SIZE = 10000

    const CHUNK_SIZE = BATCH_SIZE/200


    //clean collections
    try {
        url = generateRequest(COLLECTION) + '/all'
        var response = await axios.delete(url) 
        console.log(chalk.green.bold(' * Deleted Collection:', COLLECTION))
    } catch (error) {
        console.error(chalk.redBright.bold(error.message));
        return
    }    

    let batch_num = 1

    for (var file of fileList) {

        let total_documents = []
        
        //read the docs
        console.log(chalk.cyan.bold(" * Reading file: " + file))

        const readline = require('readline');

        const fileStream = fs.createReadStream(file);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        // Note: we use the crlfDelay option to recognize all instances of CR LF
        // ('\r\n') in input.txt as a single line break.

        for await (const line of rl) {
            // Each line in input.txt will be successively available here as `line`.
            let document = parseDocument(line);
            //console.log(`Doc from file: ${JSON.stringify(document)}`);
            total_documents.push(document)
        }
    
        console.log(chalk.cyan.bold("\n =>  Read " + total_documents.length + " total documents\n"));


        // divide all docs in batches
        let batches = []
        for (let i = 0; i < total_documents.length; i += BATCH_SIZE) {
            const chunk = total_documents.slice(i, i + BATCH_SIZE);
            batches.push(chunk)
        }

        for(let documents of batches) {

            console.log(chalk.magenta.bold(" * Batch " + batch_num + "/"+ batches.length +" (" + documents.length +  " documents)"));

            var inserted = []

            // insert them
            var collection = COLLECTION 
            console.log("\t - Inserting at Collection '" + collection + "'");
            var url = generateRequest(collection, undefined, undefined, endpoint='bulk')

            //prepare the chunks
            let chunks = []
            for (let i = 0; i < documents.length; i += CHUNK_SIZE) {
                const chunk = documents.slice(i, i + CHUNK_SIZE);
                chunks.push(chunk)
            }

            let chunk_num = 1
            for (let chunk of chunks){
                chunk_num += 1
                let docsToInsert = []
                for(var document of chunk) {
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
                        docsToInsert.push(document)

                    } catch (error) {
                        console.error(chalk.redBright.bold(error.message));
                        return
                    }           
                }
                // post the insert
                var response = await axios.post(url, chunk);     
                inserted.push(response.data) 
                // break
            }
            
            await wait()

            console.log("\t - Updating at Collection '" + collection + "'");
            chunk_num = 1
            for (let chunk of inserted){
                chunk_num += 1
                try {
                    let updates = []
                    for(var document of chunk) {
                        let update = {_id: document._id, user: document.user}
                        update.user.username = 'new.' + update.user.username
                        updates.push(update)
                    }
                    url = generateRequest(collection, undefined, undefined, endpoint='bulk')
                    // console.log(JSON.stringify(chunk[0]))
                    var response = await axios.patch(url, updates);
                } catch (error) {
                    console.error(chalk.redBright.bold(error.message));
                    console.error(chalk.red(error));
                    return
                }
                // break
                await wait(100)
            }

            await wait()

            console.log("\t - Querying currently valid version at Collection '" + collection + "'");
            for (let chunk of inserted){
                for(var document of chunk) {
                    try {
                        let id = document._id._id || document._id
                        url = generateRequest(collection, id)
                        var response = await axios.get(url);
                    } catch (error) {
                        console.error(chalk.redBright.bold(error.message));
                        return
                    }
                }
            }

            await wait()

            console.log("\t - Querying past valid version at Collection '" + collection + "'");
            for (let chunk of inserted){
                for(var document of chunk) {
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
            }

            await wait()

            console.log("\t - Querying current version at Collection '" + collection + "'");
            for (let chunk of inserted){
                for(var document of chunk) {
                    try {
                        let id = document._id._id || document._id
                        url = generateRequest(collection, id)
                        var response = await axios.get(url + "/2");
                    } catch (error) {
                        console.error(chalk.redBright.bold(error.message));
                        return
                    }
                }
            }

            await wait()

            console.log("\t - Querying previous version at Collection '" + collection + "'");
            for (let chunk of inserted){
                for(var document of chunk) {
                try {
                        let id = document._id._id || document._id
                        url = generateRequest(collection, id)
                        var response = await axios.get(url + "/1");
                    } catch (error) {
                        console.error(chalk.redBright.bold(error.message));
                        return
                    }
                }
            }

            await wait()

            console.log("\t - Find by non indexed field at current collection '" + collection + "'");
            for (let chunk of inserted){
                for(var document of chunk) {           
                    try {
                        url = generateRequest(collection, 'find', undefined, endpoint='query')
                        url += `?query="_validity.end": null,"pricePerWorkingUnit": {"$lte": ${document.pricePerWorkingUnit}}`
                        var response = await axios.get(url);
                    } catch (error) {
                        console.error(chalk.redBright.bold(error.message));
                        return
                    }
                }
            }

            await wait()

            console.log("\t - Deleting from Collection '" + collection + "'");
            for (let chunk of inserted){
                try {
                    url = generateRequest(collection, undefined, undefined, endpoint='bulk') + '/delete'
                    var response = await axios.post(url, chunk);
                } catch (error) {
                    console.error(chalk.redBright.bold(error.message));
                    return
                }
            }
            batch_num += 1
        } 
    }
}

run()
