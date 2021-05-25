module.exports = fastify => {
    const controller = require("../controllers/query.controller.js")

    // Declare a base route
    fastify.get('/query', async (request, reply) => {
        return { status: 'OK' }
    })
 
    // Query collection
    fastify.get('/query/:collection/find', async (request, reply) => {
        return controller.find(request, reply)
    })

    // Aggregate collection
    fastify.post('/query/:collection/aggregate', async (request, reply) => {
        return controller.aggregate(request, reply)
    })
  
}