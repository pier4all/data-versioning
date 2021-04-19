module.exports = fastify => {
    const controller = require("../controllers/query.controller.js");

    // Declare a base route
    fastify.get('/query', async (request, reply) => {
        return { status: 'OK' }
    })
 
    // Get all
    fastify.get('/query/:collection/find', async (request, reply) => {
        return controller.find(request, reply)
    })
  
};