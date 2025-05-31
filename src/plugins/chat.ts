import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { WebSocket, RawData } from 'ws';
import Redis from 'ioredis';
import prisma from '../lib/prisma';

interface ChatPluginOptions {
  redis: Redis;
}

interface WSMessage {
  type: 'message' | 'typing';
  body?: string;
  conversationId: string;
}

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const chatPlugin: FastifyPluginAsync<ChatPluginOptions> = async (fastify, opts) => {
  const pub = opts.redis;

  // This handler receives the raw `WebSocket` object, not `{ socket: WebSocket }`
  fastify.get('/ws', { websocket: true }, (socket: WebSocket, req: FastifyRequest) => {
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

    let user: { id: string };
    try {
      user = fastify.jwt.verify(token) as { id: string };
    } catch {
      socket.close(1008, 'Invalid JWT');
      return;
    }

    // Handle incoming messages
    socket.on('message', async (data: RawData) => {
      let msg: WSMessage;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        socket.send(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      if (msg.type === 'message') {
        const saved = await prisma.message.create({
          data: {
            body: msg.body!,
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
    const sub = new Redis(REDIS_URL);
    sub.subscribe(`chat:conversation:${conversationId}`);
    sub.on('message', (_, payload) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    });

    socket.on('close', () => sub.disconnect());
  });
};

export default chatPlugin;