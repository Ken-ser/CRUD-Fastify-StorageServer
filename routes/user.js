import FP from "fastify-plugin"
import FS from "fs/promises"

async function user(fastify, opts) {
    //sign up user
    fastify.route({
        method: "POST",
        path: "/register",
        handler: async (request, reply) => {
            const email = request.body.email;

            //read and JSON.parse file
            const jsonUsers = JSON.parse(await FS.readFile("./db/users.json"));

            //check if email is available
            for (const user of jsonUsers) {
                if (user.email == email) {
                    reply.code(409);
                    return { info: "Email already used" };
                }
            }

            //add user
            jsonUsers.splice(0, 0, request.body);
            //write entire file
            await FS.writeFile("./db/users.json", JSON.stringify(jsonUsers, null, 4));

            reply.code(201);
            return { info: "Signed up" };
        }
    });

    //sign in user
    fastify.route({
        method: "POST",
        path: "/login",
        handler: async (request, reply) => {
            const email = request.body.email;
            const password = request.body.password;

            //read and JSON.parse file
            const jsonUsers = JSON.parse(await FS.readFile("./db/users.json"));

            //check user
            for (const user of jsonUsers) {
                if (user.email == email && user.password == password) {
                    return { info: "Signed in" };
                }
            }

            reply.code(401);
            return { info: "Wrong email or password" };
        }
    });
};

export default FP(user);