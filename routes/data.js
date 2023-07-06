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

            //get file
            const file = dbData.find(file => file.key == reqKey);

            //if file exists
            if (file) {
                //check permission, owner or super user
                if (user == file.owner || jwtPayload.role == "su") {
                    return {
                        key: file.key,
                        data: file.data
                    };
                }
                else {
                    reply.code(403);
                    return { info: "Permission denied" };
                }
            }
            else {
                reply.code(404);
                return { info: "Key not found" };
            }

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

            //check valid base64 string
            if (! await fastify.isBase64(bodyData.data)) {
                reply.code(400);
                return { info: "Data must be base64 string" };
            }

            //read and JSON.parse data.json
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));

            //check if key is already used
            const file = dbData.find(file => file.key === bodyData.key);
            if (file) {
                reply.code(409);
                return { info: "Key already used" };
            }

            //add owner to new file
            bodyData.owner = user;
            //add file
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
            //get auth header, split by " ", get pos. 1 string
            const jwt = request.headers.authorization ? request.headers.authorization.split(" ")[1] : null;
            //verify token and get decoded token payload
            const jwtPayload = await fastify.verify(jwt);
            const user = jwtPayload.email;

            //get body already parsed by fastify
            const bodyData = request.body;

            //check valid base64 string
            if (! await fastify.isBase64(bodyData.data)) {
                reply.code(400);
                return { info: "Data must be base64 string" };
            }

            //read and JSON-parse data.json
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));

            //check if file exists
            const file = dbData.find(file => file.key === bodyData.key);
            if (file) {
                //check permission, owner or superuser
                if (file.owner == user || jwtPayload.role == "su") {
                    //change data
                    file.data = bodyData.data;

                    //write entire file
                    await FS.writeFile("./db/data.json", JSON.stringify(dbData, null, 4));

                    return { info: "data patched" };
                }
                else {
                    reply.code(403);
                    return { info: "Permission Denied" };
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

            //get file index
            const fileIndex = dbData.findIndex(file => file.key === reqKey);

            //check file index
            if (fileIndex != -1) {
                //check permission, owner or superuser
                if (dbData[fileIndex].owner == user || jwtPayload.role == "su") {
                    //delete file
                    dbData.splice(fileIndex, 1);

                    //write entire file
                    await FS.writeFile("./db/data.json", JSON.stringify(dbData, null, 4));

                    return { info: "data deleted" };
                }
                else {
                    reply.code(403);
                    return { info: "Permission denied" };
                }
            }

            reply.code(404);
            return { info: "Key not found" };
        }
    });
};

export default FP(data);