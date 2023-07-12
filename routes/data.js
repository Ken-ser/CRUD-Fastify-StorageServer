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
            const dbData = JSON.parse(await FS.readFile(fastify.dbPaths.dbData));

            //get file
            const file = dbData.find(file => file.key == reqKey);

            //check file existence
            fastify.assert(file, 404, "Key not found")

            //check permission, owner or super user
            fastify.assert(
                user == file.owner || role == "su"
                , 403
                , "Permission denied")

            return {
                info: "Data found",
                key: file.key,
                data: file.data
            };
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
            fastify.assert(
                await fastify.isBase64(bodyData.data)
                , 400
                , "Data must be base64 string")

            //read and JSON.parse data.json
            const dbData = JSON.parse(await FS.readFile(fastify.dbPaths.dbData));

            //check if key is already used
            fastify.assert(
                !dbData.find(file => file.key === bodyData.key)
                , 409
                , "Key already used")

            //add owner to new file
            bodyData.owner = user;
            //add file
            dbData.splice(0, 0, bodyData);

            //write entire file
            await FS.writeFile(fastify.dbPaths.dbData, JSON.stringify(dbData, null, 4));

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
            body: S.object().maxProperties(1).prop("data", S.ref("file#/properties/data")).required(),
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
            fastify.assert(
                await fastify.isBase64(newData)
                , 400
                , "Data must be base64 string")

            //read and JSON-parse data.json
            const dbData = JSON.parse(await FS.readFile(fastify.dbPaths.dbData));

            //check if file exists
            const file = dbData.find(file => file.key === reqKey);
            fastify.assert(file, 404, "Key not found")

            //check permission, owner or superuser
            fastify.assert(
                file.owner == user || role == "su"
                , 403
                , "Permission denied")

            //change data
            file.data = newData;

            //write entire file
            await FS.writeFile(fastify.dbPaths.dbData, JSON.stringify(dbData, null, 4));

            return {
                info: "Data patched",
                key: file.key,
                data: file.data
            };
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
            const dbData = JSON.parse(await FS.readFile(fastify.dbPaths.dbData));

            //get file index
            const fileIndex = dbData.findIndex(file => file.key === reqKey);

            //check file index
            fastify.assert(fileIndex != -1, 404, "key not found")
            //check permission, owner or superuser
            fastify.assert(
                dbData[fileIndex].owner == user || role == "su"
                , 403
                , "Permission denied")

            //delete file
            dbData.splice(fileIndex, 1);

            //write entire file
            await FS.writeFile(fastify.dbPaths.dbData, JSON.stringify(dbData, null, 4));

            return { info: "Data deleted" };
        }
    });
};

export default FP(data);