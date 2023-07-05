import Fastify from "fastify"
//loads all plugins found in a directory and
//automatically configures routes matching the folder structure
import AutoLoad from "@fastify/autoload"
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import JWT from "jsonwebtoken"

const fastify = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
            },
        },
    }
});

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

//attach method verify to the server instance
fastify.decorate("verify", verify)

async function sign(payload) {
    const token = JWT.sign(payload, fastify.jwtConf.secret, fastify.jwtConf.signOpt)
    return token
}

async function verify(token) {
    const payload = JWT.verify(token, fastify.jwtConf.secret)
    return payload
}

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