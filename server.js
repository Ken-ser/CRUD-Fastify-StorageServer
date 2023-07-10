import Fastify from "fastify"
//loads all plugins found in a directory and
//automatically configures routes matching the folder structure
import AutoLoad from "@fastify/autoload"
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import JWT from "jsonwebtoken"
import { S } from "fluent-json-schema"
import FS from "fs/promises"

const fastify = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
            },
        },
    },
    //defines custom schemaError response
    schemaErrorFormatter: (errors, dataVar) => {
        console.log(errors);
        switch (errors[0].instancePath) {
            case "/password":
                return new Error("Password must contain minimum 8 characters, at least one upper case letter, one lower case letter, one number and one special character (#?!@$%^&*-)");
            case "/email":
                return new Error("Invalid email");
            default:
                return new Error(errors[0].message);
        }
    }
});

//schema definition using fluent.json.schema
fastify.addSchema(S.object()
    .id("credentials")
    .prop("email", S.string().format("email").required())
    /*
    Minimum eight characters
    at least one upper case letter,
    one lower case letter,
    one number and one special character
    */
    .prop("password", S.string().pattern(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/).required())
)

fastify.addSchema(S.object()
    .id("repSignin")
    .prop("info", S.string().required())
    .prop("access_token", S.string().pattern(/^(?:[w-]*.){2}[w-]*$/).required())
    .prop("token_type", S.string().required())
    .prop("expires_in", S.string().required())
)

fastify.addSchema(S.object()
    .id("authHeader")
    .prop("authorization", S.string().pattern(/^Bearer (?:[\w-]*\.){2}[\w-]*$/).required())
)

fastify.addSchema(S.object()
    .id("file")
    .prop("key", S.string().required())
    .prop("data", S.string().minLength(1).required())
)

fastify.addSchema(S.object()
    .id("repGetData")
    .prop("info", S.string().required())
    .prop("key", S.ref("file#/properties/key"))
    .prop("data", S.ref("file#/properties/data"))
)

//attach jwtConf array to the server instance
fastify.decorate("jwtConf",
    {
        secret: "Unimi",
        signOpt: {
            algorithm: "HS256",
            expiresIn: "1h"
        }
    }
)

//attach method sign to the server instance
fastify.decorate("sign", sign)

fastify.decorate("verify", verify)

fastify.decorate("isBase64", isBase64)

fastify.decorate("getUserIndex", getUserIndex)

async function sign(payload) {
    const token = JWT.sign(payload, fastify.jwtConf.secret, fastify.jwtConf.signOpt)
    return token
}

async function verify(token) {
    const payload = JWT.verify(token, fastify.jwtConf.secret)
    return payload
}

async function isBase64(str) {
    try {
        return btoa(atob(str)) == str;
    } catch (err) {
        return false;
    }
}

async function getUserIndex(email) {
    //read and JSON.parse users.json
    const dbUsers = JSON.parse(await FS.readFile("./db/users.json"));
    //userIndex
    return dbUsers.findIndex(user => user.email === email);
}

//check verify token and check if user is registered
fastify.addHook("preValidation", async function (request, reply) {
    if (request.routerPath === "/delete" || request.routerPath === "/data/:key" || request.routerPath === "/data") {
        //get auth header, split by " ", get pos. 1 string
        const jwt = request.headers.authorization ? request.headers.authorization.split(" ")[1] : null;
        let jwtPayload;
        try {
            //verify token
            jwtPayload = await fastify.verify(jwt);
        } catch (error) {
            reply.code(400);
            throw new Error(error);
        }
        //check if user exists
        const userIndex = await fastify.getUserIndex(jwtPayload.email);
        if (userIndex != -1) {
            //put user token payload info in request.authUser
            request.authUser = {
                dbIndex: userIndex,
                email: jwtPayload.email,
                role: jwtPayload.role
            }
        }
        else {
            reply.code(401);
            throw new Error("User not registered")
        }
    }
})

//loads plugins and routes folders
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
fastify.register(AutoLoad, {
    dir: join(__dirname, "routes")
});

// Run the server
try {
    await fastify.listen({ port: 3000, host: "127.0.0.1" });
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}