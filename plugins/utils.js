import FP from "fastify-plugin"
import FS from "fs/promises"

async function utils(fastify, opts) {

    fastify.decorate("getUserIndex", getUserIndex)
    fastify.decorate("isBase64", isBase64)
    fastify.decorate("deleteFilesByUser", deleteFilesByUser)

    async function isBase64(str) {
        try {
            return btoa(atob(str)) == str;
        } catch (err) {
            return false;
        }
    }

    async function getUserIndex(email) {
        //read and JSON.parse users.json
        const dbUsers = JSON.parse(await FS.readFile(fastify.dbPaths.dbUsers));
        //userIndex
        return dbUsers.findIndex(user => user.email === email);
    }

    async function deleteFilesByUser(email) {
        //read and JSON.parse users.json
        const dbData = JSON.parse(await FS.readFile(fastify.dbPaths.dbData));

        let fileIndex = dbData.findIndex(file => file.owner == email)
        while (fileIndex != -1) {
            dbData.splice(fileIndex, 1)
            fileIndex = dbData.findIndex(file => file.owner == email)
        }

        //write entire file
        await FS.writeFile(fastify.dbPaths.dbData, JSON.stringify(dbData, null, 4));
    }
}

export default FP(utils)