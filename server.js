import Fastify from "fastify"
//loads all plugins found in a directory and
//automatically configures routes matching the folder structure
import AutoLoad from "@fastify/autoload"
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const fastify = Fastify();

//loads plugins and routes folders
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
fastify.register(AutoLoad, {
    dir: join(__dirname, "routes")
});

// Run the server
try {
    await fastify.listen({ port: 3000 });
    console.log("- Server started");
} catch (err) {
    console.log(err);
    process.exit(1);
}