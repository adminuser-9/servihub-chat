import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import prisma from '../lib/prisma';

interface CreateConvBody {
  customerId: string;
  businessId: string;
}

const convRoutes: FastifyPluginAsync = async (fastify) => {
  // List all conversations
  fastify.get('/api/conversations', async (req, reply) => {
    const convs = await prisma.conversation.findMany({
      select: { id: true, businessId: true, createdAt: true },
    });
    return convs.map(c => ({
      id: c.id.toString(),
      businessId: c.businessId.toString(),
      createdAt: c.createdAt,
    }));
  });

  // Fetch a single conversation’s metadata
  fastify.get('/api/conversations/:id', async (req: FastifyRequest, reply) => {
    const { id } = req.params as { id: string };
    const conv = await prisma.conversation.findUnique({
      where: { id: BigInt(id) },
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
  // GET /api/conversations/:id/messages
fastify.get(
  '/api/conversations/:id/messages',
  async (req: FastifyRequest, reply) => {
    const { id } = req.params as { id: string };
    const convId = BigInt(id);

    const msgs = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
    });

    return msgs.map(m => ({
      id: m.id.toString(),
      senderId: m.senderId?.toString() ?? null,
      body: m.body,
      createdAt: m.createdAt,
    }));
  }
);


  // Create or return an existing 1:1 conversation
  fastify.post(
    '/api/conversations',
    {
      schema: {
        body: {
          type: 'object',
          required: ['customerId', 'businessId'],
          properties: {
            customerId: { type: 'string' },
            businessId: { type: 'string' },
          },
        },
      },
    },
    async (req: FastifyRequest<{ Body: CreateConvBody }>, reply) => {
      const { customerId, businessId } = req.body;
      const cust = BigInt(customerId);
      const biz  = BigInt(businessId);

      // Try to find an existing direct conversation
      let conv = await prisma.conversation.findFirst({
        where: {
          businessId: biz,
          participants: {
            some: { userId: cust },
          },
        },
      });

      if (!conv) {
        // Create new conversation + participants
        conv = await prisma.conversation.create({
          data: {
            businessId: biz,
            type: 'DIRECT',
            participants: {
              create: [
                { userId: cust, role: 'CUSTOMER' },
                { userId: biz,  role: 'AGENT'    }, // adjust if agent userId differs
              ],
            },
          },
        });
      }

      return { conversationId: conv.id.toString() };
    }
  );
};

export default convRoutes;
