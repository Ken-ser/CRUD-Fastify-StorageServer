import FP from "fastify-plugin"
import JWT from "jsonwebtoken"

async function security(fastify, opts) {

    //attach jwtConf array to the server instance
    fastify.decorate("jwtConf",
        {
            secret: "Unimi",
            signOpt: {
                algorithm: "HS256",
                expiresIn: 7200 //7200s -> 2h
            }
        }
    )

    //attach method sign to the server instance
    fastify.decorate("sign", sign)

    fastify.decorate("verify", verify)

    async function sign(payload) {
        const token = JWT.sign(payload, fastify.jwtConf.secret, fastify.jwtConf.signOpt)
        return token
    }

    async function verify(token) {
        const payload = JWT.verify(token, fastify.jwtConf.secret)
        return payload
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
}

export default FP(security)