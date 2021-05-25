'use strict'

const fastify = require('fastify')

function build(opts={}) {

    const app = fastify(opts)

    // content parser
    app.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
        try {
            const json = JSON.parse(body)
            done(null, json)
        } catch (err) {
            err.statusCode = 400
            done(err, undefined)
        }
    })

    // define routes
    require("./api/crud.routes")(app)
    require("./api/query.routes")(app)

    return app
}

module.exports = build