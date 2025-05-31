"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const convRoutes = async (fastify) => {
    // List all conversations
    fastify.get('/api/conversations', async (_req, _reply) => {
        const convs = await prisma_1.default.conversation.findMany({
            select: { id: true, businessId: true, createdAt: true },
        });
        return convs.map(c => ({
            id: c.id.toString(),
            businessId: c.businessId.toString(),
            createdAt: c.createdAt,
        }));
    });
    // Fetch a single conversation’s metadata
    fastify.get('/api/conversations/:id', async (req, reply) => {
        const { id } = req.params;
        const conv = await prisma_1.default.conversation.findUnique({
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
    // Add this new route
    fastify.get('/api/my-conversations', async (req, reply) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token)
                return reply.code(401).send({ error: 'Unauthorized' });
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const conversations = await prisma_1.default.conversation.findMany({
                where: {
                    participants: {
                        some: {
                            userId: BigInt(decoded.id),
                        },
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: true,
                        },
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
                orderBy: {
                    updatedAt: 'desc',
                },
            });
            // Manually convert BigInt to string
            const safeConversations = conversations.map((conv) => ({
                id: conv.id.toString(),
                businessId: conv.businessId.toString(),
                type: conv.type,
                updatedAt: conv.updatedAt,
                participants: conv.participants.map((p) => ({
                    id: p.id.toString(),
                    userId: p.userId.toString(),
                    role: p.role,
                    joinedAt: p.joinedAt,
                    user: {
                        id: p.user.id.toString(),
                        email: p.user.email,
                        name: p.user.name,
                    },
                })),
                messages: conv.messages.map((m) => ({
                    id: m.id.toString(),
                    senderId: m.senderId?.toString(),
                    body: m.body,
                    createdAt: m.createdAt,
                })),
            }));
            return reply.send(safeConversations);
        }
        catch (err) {
            console.error(err);
            return reply.code(500).send({ error: 'Server error' });
        }
    });
    fastify.post('/api/start-chat/:businessId', async (req, res) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token)
            return res.status(401).send({ error: 'Missing token' });
        let user;
        try {
            user = fastify.jwt.verify(token);
        }
        catch {
            return res.status(401).send({ error: 'Invalid token' });
        }
        const businessId = BigInt(req.params.businessId);
        // Check if conversation already exists
        const existing = await prisma_1.default.conversation.findFirst({
            where: {
                type: 'SUPPORT_ROOM',
                businessId,
                participants: {
                    some: {
                        userId: BigInt(user.id),
                        role: 'CUSTOMER',
                    },
                },
            },
        });
        if (existing) {
            return res.send({ conversationId: existing.id.toString() });
        }
        // Fetch all staff
        const agents = await prisma_1.default.user.findMany({
            where: {
                businessId,
                id: { not: BigInt(user.id) },
            },
        });
        const conversation = await prisma_1.default.conversation.create({
            data: {
                type: 'SUPPORT_ROOM',
                businessId,
                participants: {
                    create: [
                        { userId: BigInt(user.id), role: 'CUSTOMER' },
                        ...agents.map((agent) => ({
                            userId: agent.id,
                            role: client_1.ParticipantRole.AGENT,
                        })),
                    ],
                },
            },
        });
        return res.send({ conversationId: conversation.id });
    });
    fastify.get('/api/conversations/:id/messages', async (req, _reply) => {
        const { id } = req.params;
        const convId = BigInt(id);
        const msgs = await prisma_1.default.message.findMany({
            where: { conversationId: convId },
            orderBy: { createdAt: 'asc' },
        });
        return msgs.map(m => ({
            id: m.id.toString(),
            senderId: m.senderId?.toString() ?? null,
            body: m.body,
            createdAt: m.createdAt,
        }));
    });
    // Create or return an existing 1:1 conversation
    fastify.post('/api/conversations', {
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
    }, async (req, _reply) => {
        const { customerId, businessId } = req.body;
        const cust = BigInt(customerId);
        const biz = BigInt(businessId);
        // Try to find an existing direct conversation
        let conv = await prisma_1.default.conversation.findFirst({
            where: {
                businessId: biz,
                participants: {
                    some: { userId: cust },
                },
            },
        });
        if (!conv) {
            // Create new conversation + participants
            conv = await prisma_1.default.conversation.create({
                data: {
                    businessId: biz,
                    type: 'DIRECT',
                    participants: {
                        create: [
                            { userId: cust, role: 'CUSTOMER' },
                            { userId: biz, role: 'AGENT' }, // adjust if agent userId differs
                        ],
                    },
                },
            });
        }
        return { conversationId: conv.id.toString() };
    });
};
exports.default = convRoutes;
