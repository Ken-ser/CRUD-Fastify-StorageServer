import FP from "fastify-plugin"
import FS from "fs/promises"
import NF from "node-forge"

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
            if (jsonUsers.find(user => user.email == email)) {
                reply.code(409);
                return { info: "Email already used" };
            }

            //Generate salt
            const saltBytes = NF.random.getBytesSync(16);
            const salt = NF.util.bytesToHex(saltBytes);
            //add "salt" key
            request.body.salt = salt;

            //Generate digest
            const hashInst = NF.md.sha256.create();
            hashInst.update(request.body.password + salt);
            request.body.password = hashInst.digest().toHex();

            //add "role" key with "u" value 
            request.body.role = "u";
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

            //search user
            for (const user of jsonUsers) {
                if (user.email == email) {
                    //Generate digest
                    const hashInst = NF.md.sha256.create();
                    hashInst.update(password + user.salt);
                    const hashedPw = hashInst.digest().toHex();

                    //check password
                    if (hashedPw == user.password) {
                        //create token
                        const token = await fastify.sign({ email: email, role: user.role });

                        return {
                            info: "Signed in",
                            access_token: token,
                            token_type: "JWT",
                            expires_in: "1h"
                        };
                    }
                    else
                        break;
                }
            }

            reply.code(401);
            return { info: "Wrong email or password" };
        }
    });

    //delete signed in user
    fastify.route({
        method: "DELETE",
        path: "/delete",
        handler: async (request, reply) => {
            //get auth header, split by " ", get pos. 1 string
            const jwt = request.headers.authorization.split(" ")[1];
            //verify token and get decoded token payload
            const jwtPayload = await fastify.verify(jwt);

            //read and JSON.parse file
            const jsonUsers = JSON.parse(await FS.readFile("./db/users.json"));

            //find user index
            const userIndex = jsonUsers.findIndex(user => user.email == jwtPayload.email);
            //match
            if (userIndex != -1) {
                //delete user
                jsonUsers.splice(userIndex, 1);
                //write entire file
                await FS.writeFile("./db/users.json", JSON.stringify(jsonUsers, null, 4));

                return {
                    info: "User deleted",
                    email: jwtPayload.email
                };
            }

            //the token is valid but no user was found
            reply.code(401);
            return { info: "Strange token" };
        }
    });
};

export default FP(user);