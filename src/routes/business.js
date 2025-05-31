"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessRoutes = businessRoutes;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function businessRoutes(fastify) {
    fastify.get('/api/businesses', async (req, reply) => {
        const { excludeBusinessId } = req.query;
        const businesses = await prisma.business.findMany({
            where: excludeBusinessId
                ? { id: { not: BigInt(excludeBusinessId) } }
                : undefined,
        });
        const serialized = businesses.map((b) => ({
            ...b,
            id: b.id.toString(),
        }));
        return reply.send(serialized);
    });
}
