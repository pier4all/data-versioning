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
        path.join(__dirname, 'data', 'employee.json')
        //  path.join(__dirname, 'data', 'batch_1M', 'employee_100000.json'),  
        //  path.join(__dirname, 'data', 'batch_1M', 'employee_200000.json'),  
        //  path.join(__dirname, 'data', 'batch_1M', 'employee_300000.json'),  
        //  path.join(__dirname, 'data', 'batch_1M', 'employee_400000.json'),  
        //  path.join(__dirname, 'data', 'batch_1M', 'employee_500000.json'),  
        //  path.join(__dirname, 'data', 'batch_1M', 'employee_600000.json'),  
        //  path.join(__dirname, 'data', 'batch_1M', 'employee_700000.json'),  
        //  path.join(__dirname, 'data', 'batch_1M', 'employee_800000.json'),  
        //  path.join(__dirname, 'data', 'batch_1M', 'employee_900000.json'),  
        //  path.join(__dirname, 'data', 'batch_1M', 'employee_1000000.json') 
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
    
    for (var file of fileList) {
        //read the docs
        console.log(chalk.cyan.bold("\n * Reading file: " + file))

        const readline = require('readline');

        const fileStream = fs.createReadStream(file);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        // Note: we use the crlfDelay option to recognize all instances of CR LF
        // ('\r\n') in input.txt as a single line break.
        let documents = []

        for await (const line of rl) {
            // Each line in input.txt will be successively available here as `line`.
            let document = parseDocument(line);
            //console.log(`Doc from file: ${JSON.stringify(document)}`);
            documents.push(document)
        }

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
                break
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

    //     await wait()

    //    console.log("\t - Querying currently valid version at Collection '" + collection + "'");
    //    for(var document of inserted) {
    //        try {
    //            let id = document._id._id || document._id
    //            url = generateRequest(collection, id)
    //            var response = await axios.get(url);
    //        } catch (error) {
    //            console.error(chalk.redBright.bold(error.message));
    //            return
    //        }
    //    }

    //    await wait()

    //    console.log("\t - Querying past valid version at Collection '" + collection + "'");
    //    for(var document of inserted) {
    //        try {
    //            if (document._validity) {
    //                var date = document._validity.start
    //                let id = document._id._id || document._id
    //                url = generateRequest(collection, id)
    //                var response = await axios.get(url, {params: {date}});
    //            }
    //        } catch (error) {
    //            console.error(chalk.redBright.bold(error.message));
    //            return
    //        }
    //    }

    //    await wait()

    //    console.log("\t - Querying current version at Collection '" + collection + "'");
    //    for(var document of inserted) {
    //        try {
    //            let id = document._id._id || document._id
    //            url = generateRequest(collection, id)
    //            var response = await axios.get(url + "/2");
    //        } catch (error) {
    //            console.error(chalk.redBright.bold(error.message));
    //            return
    //        }
    //    }

    //    await wait()

    //    console.log("\t - Querying previous version at Collection '" + collection + "'");
    //    for(var document of inserted) {
    //        try {
    //            let id = document._id._id || document._id
    //            url = generateRequest(collection, id)
    //            var response = await axios.get(url + "/1");
    //        } catch (error) {
    //            console.error(chalk.redBright.bold(error.message));
    //            return
    //        }
    //    }

    //    await wait()

    //    console.log("\t - Find by non indexed field at current collection '" + collection + "'");
    //    for(var document of inserted) {
    //        try {
    //            url = generateRequest(collection, 'find', undefined, endpoint='query')
    //            url += `?query="_validity.end": null,"pricePerWorkingUnit": {"$lte": ${document.pricePerWorkingUnit}}`
    //            var response = await axios.get(url);
    //        } catch (error) {
    //            console.error(chalk.redBright.bold(error.message));
    //            return
    //        }
    //    }

    //    await wait()

    //    console.log("\t - Deleting from Collection '" + collection + "'");
    //    for(var document of inserted) {
    //        try {
    //            let id = document._id._id || document._id
    //            url = generateRequest(collection, id)
    //            var response = await axios.delete(url + '/2');
    //        } catch (error) {
    //            console.error(chalk.redBright.bold(error.message));
    //            return
    //        }
    //    }
    } 
}


run()
