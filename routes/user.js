import FP from "fastify-plugin"

async function user (fastify, opts){
    //test route
    fastify.route({
        method: "GET",
        path: "/user",
        handler: async (request, reply) => {
            return {
                status: "User routes"
            };
        }
    });
};

export default FP(user);