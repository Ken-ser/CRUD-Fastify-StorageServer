import Fastify from "fastify"
//loads all plugins found in a directory and
//automatically configures routes matching the folder structure
import AutoLoad from "@fastify/autoload"
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import JWT from "@fastify/jwt"

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

//sets jwt
fastify.register(JWT, {
    secret: "UniMi",
    sign: {
        algorithm: "HS256",
        expiresIn: "1h"
    },
    decode: {
        complete: true,
        checkTyp: "JWT"
    }
});

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