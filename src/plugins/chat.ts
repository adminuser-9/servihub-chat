// src/plugins/chat.ts
import { FastifyPluginAsync } from 'fastify';
import Redis from 'ioredis';
import { WSMessage } from '../../shared/types/ws';
import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const chatPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/ws', { websocket: true }, async (connection, req) => {
    const { socket } = connection;

    const token = req.headers['sec-websocket-protocol'];
    if (!token || typeof token !== 'string') {
      socket.close(1008, 'Missing JWT');
      return;
    }

    let user: any;
    try {
      user = await fastify.jwt.verify(token);
      socket.send(JSON.stringify({ type: 'welcome', user }));
    } catch (err) {
      socket.close(1008, 'Invalid JWT');
      return;
    }

    // Find all conversation IDs this user is part of

    const userConversations: { conversationId: bigint }[] = await prisma.participant.findMany({
        where: { userId: BigInt(user.id) },
        select: { conversationId: true },
      });

    const sub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    const subscribedChannels = userConversations.map(c => `chat:conversation:${c.conversationId}`);

    if (subscribedChannels.length === 0) {
      socket.send(JSON.stringify({ type: 'info', message: 'No conversations found' }));
    }

    await sub.subscribe(...subscribedChannels);

    sub.on('message', (_, payload) => {
      socket.send(payload);
    });

    socket.on('message', async (data: Buffer) => {
      try {
        const msg: WSMessage = JSON.parse(data.toString());

        switch (msg.type) {
          case 'message': {
            const saved = await prisma.message.create({
              data: {
                body: msg.body,
                senderId: BigInt(user.id),
                conversationId: BigInt(msg.conversationId),
              },
            });

            await redis.publish(
              `chat:conversation:${msg.conversationId}`,
              JSON.stringify({
                type: 'message',
                body: saved.body,
                senderId: user.id,
                conversationId: msg.conversationId,
                createdAt: saved.createdAt,
              })
            );
            break;
          }

          case 'typing': {
            await redis.publish(
              `chat:conversation:${msg.conversationId}:typing`,
              JSON.stringify({ userId: user.id, conversationId: msg.conversationId })
            );
            break;
          }

          case 'read': {
            await prisma.message.updateMany({
              where: {
                conversationId: BigInt(msg.conversationId),
                readAt: null,
              },
              data: {
                readAt: new Date(),
              },
            });
            break;
          }
        }
      } catch (err) {
        socket.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    socket.on('close', () => {
      sub.disconnect();
    });
  });
};

export default chatPlugin;
