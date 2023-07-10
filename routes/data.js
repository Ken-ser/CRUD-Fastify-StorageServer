import FP from "fastify-plugin"
import FS from "fs/promises"
import { S } from "fluent-json-schema"

async function data(fastify, opts) {
    //get data by key
    fastify.route({
        method: "GET",
        path: "/data/:key",
        schema: {
            headers: { $ref: "authHeader" },
            response: {
                "2xx": { $ref: "repGetData" }
            }
        },
        handler: async (request, reply) => {
            //user data from preValidation hook
            const user = request.authUser.email;
            const role = request.authUser.role;

            //get key
            const reqKey = request.params.key;

            //read and JSON.parse data.json
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));

            //get file
            const file = dbData.find(file => file.key == reqKey);

            //if file exists
            if (file) {
                //check permission, owner or super user
                if (user == file.owner || role == "su") {
                    return {
                        info: "Data found",
                        key: file.key,
                        data: file.data
                    };
                }
                else {
                    reply.code(403);
                    return new Error("Permission denied");
                }
            }
            else {
                reply.code(404);
                return new Error("Key not found");
            }

        }
    });

    //post key-data
    fastify.route({
        method: "POST",
        path: "/data",
        schema: {
            headers: { $ref: "authHeader" },
            body: { $ref: "file" }
        },
        handler: async (request, reply) => {
            //user data from preValidation hook
            const user = request.authUser.email;

            //get body already parsed by fastify
            const bodyData = request.body;

            //check valid base64 string
            if (! await fastify.isBase64(bodyData.data)) {
                reply.code(400);
                return new Error("Data must be base64 string");
            }

            //read and JSON.parse data.json
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));

            //check if key is already used
            const file = dbData.find(file => file.key === bodyData.key);
            if (file) {
                reply.code(409);
                return new Error("Key already used");
            }

            //add owner to new file
            bodyData.owner = user;
            //add file
            dbData.splice(0, 0, bodyData);

            //write entire file
            await FS.writeFile("./db/data.json", JSON.stringify(dbData, null, 4));

            reply.code(201);
            return { info: "Data stored" };
        }
    });

    //patch data by key
    fastify.route({
        method: "PATCH",
        path: "/data/:key",
        schema: {
            headers: { $ref: "authHeader" },
            body: S.object().prop("data", S.ref("file#/properties/data")).required(),
            response: {
                "2xx": { $ref: "repGetData" }
            }
        },
        handler: async (request, reply) => {
            //user data from preValidation hook
            const user = request.authUser.email;
            const role = request.authUser.role;

            //get body already parsed by fastify
            const newData = request.body.data;
            //get key
            const reqKey = request.params.key;

            //check valid base64 string
            if (! await fastify.isBase64(newData)) {
                reply.code(400);
                return new Error("Data must be base64 string");
            }

            //read and JSON-parse data.json
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));

            //check if file exists
            const file = dbData.find(file => file.key === reqKey);
            if (file) {
                //check permission, owner or superuser
                if (file.owner == user || role == "su") {
                    //change data
                    file.data = newData;

                    //write entire file
                    await FS.writeFile("./db/data.json", JSON.stringify(dbData, null, 4));

                    return {
                        info: "Data patched",
                        key: file.key,
                        data: file.data
                    };
                }
                else {
                    reply.code(403);
                    return new Error("Permission Denied");
                }
            }

            reply.code(404);
            return new Error("Key not found");
        }
    });

    //delete data by key
    fastify.route({
        method: "DELETE",
        path: "/data/:key",
        schema: {
            headers: { $ref: "authHeader" }
        },
        handler: async (request, reply) => {
            //user data from preValidation hook
            const user = request.authUser.email;
            const role = request.authUser.role;

            //requested key
            const reqKey = request.params.key;

            //read and JSON-parse data.json
            const dbData = JSON.parse(await FS.readFile("./db/data.json"));

            //get file index
            const fileIndex = dbData.findIndex(file => file.key === reqKey);

            //check file index
            if (fileIndex != -1) {
                //check permission, owner or superuser
                if (dbData[fileIndex].owner == user || role == "su") {
                    //delete file
                    dbData.splice(fileIndex, 1);

                    //write entire file
                    await FS.writeFile("./db/data.json", JSON.stringify(dbData, null, 4));

                    return { info: "Data deleted" };
                }
                else {
                    reply.code(403);
                    return new Error("Permission denied");
                }
            }

            reply.code(404);
            return new Error("Key not found");
        }
    });
};

export default FP(data);