module.exports = fastify => {
    const controller = require("../controllers/bulk.controller.js")

    // Declare a base route
    fastify.get('/bulk', async (request, reply) => {
        return { status: 'OK' }
    })

   // Create a new Document or multiple Documents
  fastify.post("/bulk/:collection", async (request, reply) => {
    return controller.createMany(request, reply)
   })

  // Update Many Documents
  fastify.patch("/bulk/:collection", async (request, reply) => {
    return controller.updateMany(request, reply)
  })
  
  // Delete Bulk
  fastify.post("/bulk/:collection/delete", async (request, reply) => {
    return controller.deleteMany(request, reply)
  })

}