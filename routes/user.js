import FP from "fastify-plugin"
import FS from "fs/promises"
import NF from "node-forge"

async function user(fastify, opts) {
    //sign up user
    fastify.route({
        method: "POST",
        path: "/register",
        schema: {
            body: { $ref: "credentials" }
        },
        handler: async (request, reply) => {
            const email = request.body.email;

            //read and JSON.parse file
            const dbUsers = JSON.parse(await FS.readFile("./db/users.json"));

            //check if email is available
            if (dbUsers.find(user => user.email == email)) {
                reply.code(409);
                return new Error("Email already used");
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
            dbUsers.splice(0, 0, request.body);

            //write entire file
            await FS.writeFile("./db/users.json", JSON.stringify(dbUsers, null, 4));

            reply.code(201);
            return { info: "Signed up" };
        }
    });

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
            const email = request.body.email;
            const password = request.body.password;

            //read and JSON.parse file
            const dbUsers = JSON.parse(await FS.readFile("./db/users.json"));

            //search user
            for (const user of dbUsers) {
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
                            expires_in: fastify.jwtConf.signOpt.expiresIn
                        };
                    }
                    else
                        break;
                }
            }

            reply.code(401);
            return new Error("Wrong email or password");
        }
    });

    //delete signed in user
    fastify.route({
        method: "DELETE",
        path: "/delete",
        schema: {
            headers: { $ref: "authHeader" }
        },
        handler: async (request, reply) => {
            //read and JSON.parse users.json
            const dbUsers = JSON.parse(await FS.readFile("./db/users.json"));

            //delete user
            dbUsers.splice(request.authUser.dbIndex, 1);
            //write entire file
            await FS.writeFile("./db/users.json", JSON.stringify(dbUsers, null, 4));

            //delete user's files
            await fastify.deleteFilesByUser(request.authUser.email)

            return {
                info: "User deleted",
                email: request.authUser.email
            };
        }
    });
};

export default FP(user);