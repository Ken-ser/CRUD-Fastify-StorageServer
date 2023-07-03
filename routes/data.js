import FP from "fastify-plugin"
import FS from "fs/promises"

async function data(fastify, opts) {
    //get data by key
    fastify.route({
        method: "GET",
        path: "/data/:key",
        handler: async (request, reply) => {
            //read file
            const rawData = await FS.readFile("./db/data.json");
            //JSON parse file
            const jsonData = JSON.parse(rawData);
            jsonData
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
            return { info: "Key not found" };
        }
    });

    //post key-data
    fastify.route({
        method: "POST",
        path: "/data",
        handler: async (request, reply) => {
            //already parsed by fastify
            const bodyData = request.body;
            //read file
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));
            //add data at position 0
            dbData.splice(0,0, bodyData);

            //write entire file
            await FS.writeFile("./db/data.json", JSON.stringify(dbData, null, 2));

            reply.code(201);
            return { info: "data stored" }; 
        }
    });
};

export default FP(data);