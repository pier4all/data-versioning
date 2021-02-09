module.exports = fastify => {
    const events = require("../controllers/events.controller.js");

    // Declare a base route
    fastify.get('/', async (request, reply) => {
        return { status: 'OK' }
    })
 
    // Get all
    fastify.get('/events/all', async (request, reply) => {
        return events.findAll(request, reply)
    })

    // Find by ID
   fastify.get('/events/:id', async (request, reply) => {
    return events.findOne(request, reply)
   })

    // Create a new Event
  fastify.post("/events/create", async (request, reply) => {
    return events.create(request, reply)
   })

};