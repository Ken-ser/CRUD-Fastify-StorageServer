import FP from "fastify-plugin"
import FS from "fs/promises"

async function data(fastify, opts) {
    //test route
    fastify.route({
        method: "GET",
        path: "/data/:key",
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
                        console.log("- Key " + o.key + " found with data: " + o.data);
                        return {
                            key: o.key,
                            data: o.data
                        };
                    }
                }
                return { status: "Key not found"}
            } catch (error) {
                console.error(`Got an error trying to read the file: ${error.message}`);
                return { status: "error"}
            }
        }
    });
};

export default FP(data);