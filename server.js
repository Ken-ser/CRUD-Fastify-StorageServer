import Fastify from "fastify";

const fastify = Fastify();

//test route
fastify.route({
    method: "GET",
    path: "/test",
    handler: async (request, reply) => {
        return {
            status: "OK"
        };
    }
});

// Run the server
try {
    await fastify.listen({ port: 3000 });
    console.log("- Server started");
} catch (err) {
    console.log(err);
    process.exit(1);
}