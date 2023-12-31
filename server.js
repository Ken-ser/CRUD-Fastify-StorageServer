import Fastify from "fastify"
//loads all plugins found in a directory and
//automatically configures routes matching the folder structure
import AutoLoad from "@fastify/autoload"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import FSensible from "@fastify/sensible"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
        console.log(errors)
        switch (errors[0].instancePath) {
            case "/password":
                return new Error("Password must contain minimum 8 characters, at least one upper case letter, one lower case letter, one number and one special character (#?!@$%^&*-)")
            case "/email":
                return new Error("Invalid email")
            default:
                return new Error(errors[0].message)
        }
    }
})

//attach db paths to the server instance
fastify.decorate("dbPaths",
    {
        dbUsers: "./db/users.json",
        dbData: "./db/data.json"
    }
)
//attach jwt configuration options to the server instance
fastify.decorate("jwtConf",
    {
        secret: "Unimi",
        signOpt: {
            algorithm: "HS256",
            expiresIn: 7200 //7200s -> 2h
        }
    }
)

fastify.register(FSensible)
//load plugins and routes folders
fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins")
})
fastify.register(AutoLoad, {
    dir: join(__dirname, "routes")
})

//Run the server
try {
    await fastify.listen({ port: 3000, host: "127.0.0.1" })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}