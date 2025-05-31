// src/routes/business.ts
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function businessRoutes(fastify: FastifyInstance) {
 fastify.get('/api/businesses', async (req, reply) => {
  const { excludeBusinessId } = req.query as { excludeBusinessId?: string };

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
