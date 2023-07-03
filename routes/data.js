import FP from "fastify-plugin"
import FS from "fs/promises"

async function data(fastify, opts) {
    //test route
    fastify.route({
        method: "GET",
        path: "/data/:key",
        onError: async (request, reply, error) => {
            return { status: error };
        },
        handler: async (request, reply) => {
            try {
                //read file
                const rawData = await FS.readFile("./db/data.json");
                //JSON parse file
                const jsonData = JSON.parse(rawData);
                //search key
                for (const o of jsonData) {
                    if (o.key == request.params.key) {
                        //key found
                        return {
                            key: o.key,
                            data: o.data
                        };
                    }
                }
                reply.code(404);
                return { status: "Key not found"}
            } catch (error) {
                throw new Error("error");
            }
        }
    });
};

export default FP(data);