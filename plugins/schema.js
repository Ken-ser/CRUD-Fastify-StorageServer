import FP from "fastify-plugin"
import { S } from "fluent-json-schema"

async function schema(fastify, opts) {
    //schema definition using fluent.json.schema
    fastify.addSchema(S.object()
        .id("credentials")
        .maxProperties(2)
        .prop("email", S.string().format("email").required())
        /*
        Minimum eight characters
        at least one upper case letter,
        one lower case letter,
        one number and one special character
        */
        .prop("password", S.string().pattern(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/).required())
    )

    fastify.addSchema(S.object()
        .id("repSignin")
        .prop("info", S.string().required())
        .prop("access_token", S.string().pattern(/^(?:[w-]*.){2}[w-]*$/).required())
        .prop("token_type", S.string().required())
        .prop("expires_in", S.integer().required())
    )

    fastify.addSchema(S.object()
        .id("authHeader")
        .prop("authorization", S.string().pattern(/^Bearer (?:[\w-]*\.){2}[\w-]*$/).required())
    )

    fastify.addSchema(S.object()
        .id("file")
        .maxProperties(2)
        .prop("key", S.string().required())
        .prop("data", S.string().minLength(1).required())
    )

    fastify.addSchema(S.object()
        .id("repGetData")
        .prop("info", S.string().required())
        .prop("key", S.ref("file#/properties/key"))
        .prop("data", S.ref("file#/properties/data"))
    )
}

export default FP(schema)