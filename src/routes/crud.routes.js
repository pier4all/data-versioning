module.exports = fastify => {
    const controller = require("../controllers/crud.controller.js");

    // Declare a base route
    fastify.get('/crud', async (request, reply) => {
        return { status: 'OK' }
    })
 
    // Get all
    fastify.get('/crud/:collection/all', async (request, reply) => {
        return controller.findAll(request, reply)
    })

    // Find valid version by ID (current or optionally on a given date)
   fastify.get('/crud/:collection/:id', async (request, reply) => {
    return controller.findValidVersion(request, reply)
   })

   // Find by ID and version number
   fastify.get('/crud/:collection/:id/:version', async (request, reply) => {
    return controller.findVersion(request, reply)
   })

   // Create a new Document
  fastify.post("/crud/:collection", async (request, reply) => {
    return controller.create(request, reply)
   })

  // Update an Document
  fastify.patch("/crud/:collection/:id", async (request, reply) => {
    return controller.update(request, reply)
  })

  // Delete an Document
  fastify.delete("/crud/:collection/:id", async (request, reply) => {
    return controller.delete(request, reply)
  })

};