import FP from "fastify-plugin"
import RL from "@fastify/rate-limit"

async function rateLimiting(fastify, opts) {
    //add rate limiting
    await fastify.register(RL, {
        global: true,
        //continueExceeding: true,
        max: 2,
        timeWindow: 1000 * 60, //ms
        errorResponseBuilder: function (request, context) {
            return {
                statusCode: 429,
                error: "Too Many Requests",
                message: "Rate limit exceeded",
                maxRequests: context.max,
                timeWindow: context.after,
                expiresIn: context.ttl
            }
        }
    })

    //rate limit not found route to avoid path scan
    fastify.setNotFoundHandler({
        preHandler: fastify.rateLimit({
            max: 3,
            timeWindow: 1000 * 60 //ms
        })
    }, function (request, reply) {
        throw fastify.httpErrors.notFound(`Route ${request.method}:${request.url} not found`)
    })
}
export default FP(rateLimiting)