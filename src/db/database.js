let mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
let chalk = require('chalk');


// read credentials
let mongodb_uri

class Database {
    constructor(_mongodb_uri) {
        mongodb_uri = _mongodb_uri
    }

    connect(callback) {
        console.log(chalk.yellow("Database.connect: DB connecting (" + mongodb_uri + ") ... "));
        mongoose.connect(mongodb_uri, {useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false}).then(() => {
                console.log(chalk.green.bold("Database.connect: DB connected "));
                if (callback){
                    callback(undefined, "OK");
                }
            })
            .catch((err) => {
                console.error(`Database.connect: MongoDB connection error. Please make sure MongoDB is running:` + err);
                if (callback){
                    callback(err, undefined);
                }
            });
    }

    end(){
        console.log(chalk.red("Database.end: DB closing..."));
        mongoose.connection.close().then(() => {
            console.log(chalk.red.bold("Database.end: DB disconnected "));
        })
      }
}

module.exports.Database = Database