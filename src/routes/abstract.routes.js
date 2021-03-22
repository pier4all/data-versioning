module.exports = fastify => {
    const controller = require("../controllers/abstract.controller.js");

    // Declare a base route
    fastify.get('/', async (request, reply) => {
        return { status: 'OK' }
    })
 
    // Get all
    fastify.get('/:collection/all', async (request, reply) => {
        return controller.findAll(request, reply)
    })

    // Find valid version by ID (current or optionally on a given date)
   fastify.get('/:collection/:id', async (request, reply) => {
    return controller.findValidVersion(request, reply)
   })

   // Find by ID and version number
   fastify.get('/:collection/:id/:version', async (request, reply) => {
    return controller.findVersion(request, reply)
   })

   // Create a new Document
  fastify.post("/:collection/create", async (request, reply) => {
    return controller.create(request, reply)
   })

  // Update an Document
  fastify.patch("/:collection/update/:id", async (request, reply) => {
    return controller.update(request, reply)
  })

  // Delete an Document
  fastify.delete("/:collection/delete/:id", async (request, reply) => {
    return controller.delete(request, reply)
  })

};