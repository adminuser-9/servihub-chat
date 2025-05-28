// src/routes/conversations.ts
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import prisma from '../lib/prisma';  // adjust if your prisma client lives elsewhere

const convRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/conversations — list all conversation IDs
fastify.get('/api/conversations', async (req, reply) => {
  const convs = await prisma.conversation.findMany({
    select: { id: true, businessId: true, createdAt: true },
  });
  return convs.map(c => ({ id: c.id.toString(), businessId: c.businessId.toString(), createdAt: c.createdAt }));
});

  fastify.get('/api/conversations/:id', async (req: FastifyRequest, reply) => {
    const { id } = req.params as { id: string };
    const convId = BigInt(id);

    const conv = await prisma.conversation.findUnique({
      where: { id: convId },
      include: { business: true },
    });

    if (!conv) {
      reply.code(404);
      return { error: 'Conversation not found' };
    }

    return {
      conversationId: conv.id.toString(),
      businessName: conv.business.name,
    };
  });
};

export default convRoutes;
