import FP from "fastify-plugin"
import FS from "fs/promises"

async function data(fastify, opts) {
    //get data by key
    fastify.route({
        method: "GET",
        path: "/data/:key",
        handler: async (request, reply) => {
            //read and JSON.parse file
            const jsonData = JSON.parse(await FS.readFile("./db/data.json"));

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
            //get body already parsed by fastify
            const bodyData = request.body;
            //read and JSON.parse file
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));
            //add data at position 0
            dbData.splice(0, 0, bodyData);

            //write entire file
            await FS.writeFile("./db/data.json", JSON.stringify(dbData, null, 4));

            reply.code(201);
            return { info: "data stored" };
        }
    });

    //patch data by key
    fastify.route({
        method: "PATCH",
        path: "/data",
        handler: async (request, reply) => {
            //get body already parsed by fastify
            const bodyData = request.body;
            //read and JSON-parse file
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));

            //search key
            for (const object of dbData) {
                if (object.key == bodyData.key) {
                    //key found

                    //change data
                    object.data = bodyData.data;

                    //write entire file
                    await FS.writeFile("./db/data.json", JSON.stringify(dbData, null, 4));

                    return { info: "data patched" };
                }
            }
            reply.code(404);
            return { info: "Key not found" };
        }
    });

    //delete data by key
    fastify.route({
        method: "DELETE",
        path: "/data/:key",
        handler: async (request, reply) => {
            //read and JSON-parse file
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));

            //search key
            for (let index = 0; index < dbData.length; index++) {

                if (dbData[index].key == request.params.key) {
                    //key found

                    //delete object
                    dbData.splice(index, 1);

                    //write entire file
                    await FS.writeFile("./db/data.json", JSON.stringify(dbData, null, 4));

                    return { info: "data deleted" };
                }
            }
            reply.code(404);
            return { info: "Key not found" };
        }
    });
};

export default FP(data);