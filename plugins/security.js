import FP from "fastify-plugin"
import JWT from "jsonwebtoken"
import NF from "node-forge"

async function security(fastify, opts) {

    //attach method sign to the server instance
    fastify.decorate("sign", sign)
    fastify.decorate("verify", verify)
    fastify.decorate("getSalt", getSalt)
    fastify.decorate("getHash", getHash)

    async function sign(payload) {
        const token = JWT.sign(payload, fastify.jwtConf.secret, fastify.jwtConf.signOpt)
        return token
    }

    async function verify(token) {
        const payload = JWT.verify(token, fastify.jwtConf.secret)
        return payload
    }

    //sha256
    async function getHash(str) {
        //generate hash
        const hashInst = NF.md.sha256.create();
        hashInst.update(str);

        return hashInst.digest().toHex()
    }

    async function getSalt() {
        //Generate salt
        const saltBytes = NF.random.getBytesSync(16);

        return NF.util.bytesToHex(saltBytes);
    }

    //check verify token and check if user is registered
    fastify.addHook("preValidation", async function (request, reply) {
        if (request.routerPath === "/delete"
            || request.routerPath === "/data/:key"
            || request.routerPath === "/data") {
            
            fastify.assert(request.headers.authorization, 400, "JWT must be provided")
            
            //get auth header, split by " ", get pos. 1 string
            const jwt = request.headers.authorization.split(" ")[1];

            let jwtPayload;
            try {
                //verify token
                jwtPayload = await fastify.verify(jwt);
            } catch (error) {
                throw fastify.httpErrors.badRequest(error)
            }

            //check if user exists
            const userIndex = await fastify.getUserIndex(jwtPayload.email);
            fastify.assert(userIndex != -1, 401, "User not registered")

            //put user token payload info in request.authUser
            request.authUser = {
                dbIndex: userIndex,
                email: jwtPayload.email,
                role: jwtPayload.role
            }
        }
    })
}

export default FP(security)