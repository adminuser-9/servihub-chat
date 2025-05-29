import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { WebSocket, RawData } from 'ws';
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
    const tokenHeader = req.headers['sec-websocket-protocol'];
    const token = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;

    if (!token) {
      socket.close(1008, 'Missing JWT');
      return;
    }

    let user: { id: string };
    try {
      user = fastify.jwt.verify<{ id: string }>(token);
    } catch {
      socket.close(1008, 'Invalid JWT');
      return;
    }

    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const conversationId = url.searchParams.get('conversationId');
    if (!conversationId) {
      socket.close(1008, 'Missing conversationId');
      return;
    }

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

    const sub = new Redis(REDIS_URL);
    sub.subscribe(`chat:conversation:${conversationId}`);
    sub.on('message', (_, payload) => socket.send(payload));
    socket.on('close', () => sub.disconnect());
  });
};

export default chatPlugin;