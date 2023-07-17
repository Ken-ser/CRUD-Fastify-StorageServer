import FS from "fs/promises"

async function user(fastify, opts) {
    //sign up user
    fastify.route({
        method: "POST",
        path: "/register",
        schema: {
            body: { $ref: "credentials" }
        },
        handler: async (request, reply) => {
            const email = request.body.email

            //read and JSON.parse file
            const dbUsers = JSON.parse(await FS.readFile(fastify.dbPaths.dbUsers))

            //check if email is available
            fastify.assert(
                !dbUsers.find(user => user.email == email)
                , 409
                , "Email already used")

            //Generate salt and "salted" hassh
            const salt = await fastify.getSalt()
            request.body.password = await fastify.getHash(request.body.password + salt)
            request.body.salt = salt
            //add "role" key with "u" value 
            request.body.role = "u"

            //add user
            dbUsers.splice(0, 0, request.body)

            //write entire file
            await FS.writeFile(fastify.dbPaths.dbUsers, JSON.stringify(dbUsers, null, 4))

            reply.code(201)
            return { info: "Signed up" }
        }
    })

    //sign in user
    fastify.route({
        method: "POST",
        path: "/login",
        schema: {
            body: { $ref: "credentials" },
            response: {
                "2xx": { $ref: "repSignin" }
            }
        },
        handler: async (request, reply) => {
            const email = request.body.email
            const password = request.body.password

            //read and JSON.parse file
            const dbUsers = JSON.parse(await FS.readFile(fastify.dbPaths.dbUsers))

            //search user
            const user = dbUsers.find(user => user.email == email)
            fastify.assert(user, 401, "User not registered")
            //generate hash and check password
            fastify.assert(
                await fastify.getHash(password + user.salt) == user.password
                , 401
                , "Wrong email or password")

            //create token
            const token = await fastify.sign({ email: email, role: user.role })

            return {
                info: "Signed in",
                access_token: token,
                token_type: "JWT",
                expires_in: fastify.jwtConf.signOpt.expiresIn
            }
        }
    })

    //delete signed in user
    fastify.route({
        method: "DELETE",
        path: "/delete",
        schema: {
            headers: { $ref: "authHeader" }
        },
        handler: async (request, reply) => {
            //read and JSON.parse users.json
            const dbUsers = JSON.parse(await FS.readFile(fastify.dbPaths.dbUsers))

            //delete user
            dbUsers.splice(request.authUser.dbIndex, 1)
            //write entire file
            await FS.writeFile(fastify.dbPaths.dbUsers, JSON.stringify(dbUsers, null, 4))

            //delete user's files
            await fastify.deleteFilesByUser(request.authUser.email)

            return {
                info: "User deleted",
                email: request.authUser.email
            }
        }
    })
}

export default user
