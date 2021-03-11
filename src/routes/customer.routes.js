module.exports = fastify => {
    const customer = require("../controllers/customer.controller.js");

    // Declare a base route
    fastify.get('/', async (request, reply) => {
        return { status: 'OK' }
    })
 
    // Get all
    fastify.get('/customers/all', async (request, reply) => {
        return customer.findAll(request, reply)
    })

    // Find valid version by ID (current or optionally on a given date)
   fastify.get('/customers/:id', async (request, reply) => {
    return customer.findValidVersion(request, reply)
   })

   // Find by ID and version number
   fastify.get('/customers/:id/:version', async (request, reply) => {
    return customer.findVersion(request, reply)
   })

   // Create a new Event
  fastify.post("/customers/create", async (request, reply) => {
    return customer.create(request, reply)
   })

  // Update an Event
  fastify.patch("/customers/update/:id", async (request, reply) => {
    return customer.update(request, reply)
  })

  // Delete an Event
  fastify.delete("/customers/delete/:id", async (request, reply) => {
    return customer.delete(request, reply)
  })

};