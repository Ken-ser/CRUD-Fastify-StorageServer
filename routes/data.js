import FP from "fastify-plugin"

async function data (fastify, opts){
    //test route
    fastify.route({
        method: "GET",
        path: "/data",
        handler: async (request, reply) => {
            return {
                status: "Data routes"
            };
        }
    });
};

export default FP(data);