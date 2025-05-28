// src/plugins/chat.ts
import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import Redis from 'ioredis';
import prisma from '../lib/prisma';

interface ChatPluginOptions {
  redis: Redis;
}

interface WSMessage {
  type: 'message' | 'typing' | 'read';
  body?: string;
  conversationId: string;
}

const chatPlugin: FastifyPluginAsync<ChatPluginOptions> = async (fastify, opts) => {
  const { redis: pub } = opts;
  // We still create a separate subscriber client:
  const subClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

  fastify.get('/ws', { websocket: true }, (connection: any, req: FastifyRequest) => {
    const socket = connection.socket as WebSocket;

    // JWT from subprotocol
    const tokenHeader = req.headers['sec-websocket-protocol'];
    const token = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
    if (!token) {
      socket.close(1008, 'Missing JWT');
      return;
    }

    (async () => {
      let user: any;
      try {
        user = await fastify.jwt.verify(token);
        socket.send(JSON.stringify({ type: 'welcome', user }));
      } catch {
        socket.close(1008, 'Invalid JWT');
        return;
      }

      // load conversations
      const convs = await prisma.participant.findMany({
        where: { userId: BigInt(user.id) },
        select: { conversationId: true },
      });

      const channels = convs.map(c => `chat:conversation:${c.conversationId}`);
      if (channels.length) {
        await subClient.subscribe(...channels);
        subClient.on('message', (_, payload) => socket.send(payload));
      } else {
        socket.send(JSON.stringify({ type: 'info', message: 'No conversations found' }));
      }

      socket.on('message', async (buf: Buffer) => {
        try {
          const msg = JSON.parse(buf.toString()) as WSMessage;
          if (msg.type === 'message') {
            const saved = await prisma.message.create({
              data: {
                body: msg.body!,
                senderId: BigInt(user.id),
                conversationId: BigInt(msg.conversationId),
              },
            });
            await pub.publish(
              `chat:conversation:${msg.conversationId}`,
              JSON.stringify({
                type: 'message',
                body: saved.body,
                senderId: user.id,
                conversationId: msg.conversationId,
                createdAt: saved.createdAt,
              })
            );
          } else if (msg.type === 'typing') {
            await pub.publish(
              `chat:conversation:${msg.conversationId}:typing`,
              JSON.stringify({ userId: user.id, conversationId: msg.conversationId })
            );
          } else if (msg.type === 'read') {
            await prisma.message.updateMany({
              where: {
                conversationId: BigInt(msg.conversationId),
                readAt: null,
              },
              data: { readAt: new Date() },
            });
          }
        } catch {
          socket.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      socket.on('close', () => {
        subClient.disconnect();
      });
    })();
  });
};

export default chatPlugin;
