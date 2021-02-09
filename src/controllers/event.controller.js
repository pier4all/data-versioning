
const Event = require("../models/events");

exports.createEvent = (data, callback) => {
    console.log("event.controller.createEvent: connected, creating event")

    var event = new Event(data);
    event.save().then((event) => { callback(event); }).catch((err) => { console.log(err); process.exit(); })
}

exports.updateEvent = (event, callback) => {
    console.log("event.controller.updateEvent: called update new model")
    event.save()
        .then((event) => { callback(event); })
        .catch((err) => { console.log(err); process.exit(); })
}

exports.queryEvent = (query, callback) => {
    console.log("event.controller.queryEvent: called query event")
    console.log(query)

    Event.findOne(query, function (err, found_event) { console.log("event.controller.queryEvent: found: \n" + found_event); callback(query)});
    
}