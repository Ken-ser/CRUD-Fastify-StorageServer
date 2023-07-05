import FP from "fastify-plugin"
import FS from "fs/promises"

async function data(fastify, opts) {
    //get data by key
    fastify.route({
        method: "GET",
        path: "/data/:key",
        handler: async (request, reply) => {
            //get auth header, split by " ", get pos. 1 string
            const jwt = request.headers.authorization ? request.headers.authorization.split(" ")[1] : null;
            //verify token and get decoded token payload
            const jwtPayload = await fastify.verify(jwt);
            const user = jwtPayload.email;
            const reqKey = request.params.key;

            //read and JSON.parse data.json
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));

            //get user's folder
            const folder = dbData.find(folder => folder.owner === user);

            //check folder
            if (folder) {
                //get file
                const file = folder.files.find(file => file.key === reqKey);
                if (file)
                    return {
                        key: file.key,
                        data: file.data
                    };
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
            //get auth header, split by " ", get pos. 1 string
            const jwt = request.headers.authorization ? request.headers.authorization.split(" ")[1] : null;
            //verify token and get decoded token payload
            const jwtPayload = await fastify.verify(jwt);
            const user = jwtPayload.email;

            //get body already parsed by fastify
            const bodyData = request.body;
            //read and JSON.parse data.json
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));

            //get user's folder
            const folder = dbData.find(folder => folder.owner === user);

            //check folder
            if (folder) {
                //add file at position 0
                folder.files.splice(0, 0, bodyData);
            }
            else {
                //add folder with file
                dbData.splice(0, 0, {
                    owner: user,
                    files: [bodyData]
                });
            }

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
            //get auth header, split by " ", get pos. 1 string
            const jwt = request.headers.authorization ? request.headers.authorization.split(" ")[1] : null;
            //verify token and get decoded token payload
            const jwtPayload = await fastify.verify(jwt);
            const user = jwtPayload.email;

            //get body already parsed by fastify
            const bodyData = request.body;
            //read and JSON-parse data.json
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));

            //get user's folder
            const folder = dbData.find(folder => folder.owner === user);

            //check folder
            if (folder) {
                //get file
                const file = folder.files.find(file => file.key === bodyData.key);
                if (file) {
                    //change data
                    file.data = bodyData.data;

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
            //get auth header, split by " ", get pos. 1 string
            const jwt = request.headers.authorization ? request.headers.authorization.split(" ")[1] : null;
            //verify token and get decoded token payload
            const jwtPayload = await fastify.verify(jwt);
            const user = jwtPayload.email;

            //requested key
            const reqKey = request.params.key;

            //read and JSON-parse data.json
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));

            //get user's folder
            const folder = dbData.find(folder => folder.owner === user);

            //check folder
            if (folder) {
                //get file
                const fileIndex = folder.files.findIndex(file => file.key === reqKey);
                if (fileIndex != -1) {
                    //delete file
                    folder.files.splice(fileIndex, 1);

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