"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const chatPlugin = async (fastify, opts) => {
    const pub = opts.redis;
    // This handler receives the raw `WebSocket` object, not `{ socket: WebSocket }`
    fastify.get('/ws', { websocket: true }, (socket, req) => {
        // ✅ Use URL query token instead of sec-websocket-protocol
        const url = new URL(req.url ?? '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        const conversationId = url.searchParams.get('conversationId');
        if (!token) {
            socket.close(1008, 'Missing JWT');
            return;
        }
        if (!conversationId) {
            socket.close(1008, 'Missing conversationId');
            return;
        }
        let user;
        try {
            user = fastify.jwt.verify(token);
        }
        catch {
            socket.close(1008, 'Invalid JWT');
            return;
        }
        // Handle incoming messages
        socket.on('message', async (data) => {
            let msg;
            try {
                msg = JSON.parse(data.toString());
            }
            catch {
                socket.send(JSON.stringify({ error: 'Invalid JSON' }));
                return;
            }
            if (msg.type === 'message') {
                const saved = await prisma_1.default.message.create({
                    data: {
                        body: msg.body,
                        senderId: BigInt(user.id),
                        conversationId: BigInt(msg.conversationId),
                    },
                });
                await pub.publish(`chat:conversation:${msg.conversationId}`, JSON.stringify({
                    type: 'message',
                    body: saved.body,
                    senderId: user.id,
                    conversationId: msg.conversationId,
                    createdAt: saved.createdAt,
                }));
            }
            if (msg.type === 'typing') {
                await pub.publish(`chat:conversation:${msg.conversationId}`, JSON.stringify({
                    type: 'typing',
                    senderId: user.id,
                    conversationId: msg.conversationId,
                }));
            }
        });
        // Subscribe to conversation channel
        const sub = new ioredis_1.default(REDIS_URL);
        sub.subscribe(`chat:conversation:${conversationId}`);
        sub.on('message', (_, payload) => {
            if (socket.readyState === ws_1.WebSocket.OPEN) {
                socket.send(payload);
            }
        });
        socket.on('close', () => sub.disconnect());
    });
};
exports.default = chatPlugin;
