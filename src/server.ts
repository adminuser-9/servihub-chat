import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import chatPlugin from './plugins/chat';
import { createClient } from 'redis'; // ✅ new

dotenv.config();

const app = Fastify({
  logger: true,
});

const start = async () => {
  try {
    const redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    await redisClient.connect(); // ✅ Important!

    await app.register(websocket);
    await app.register(jwt, {
      secret: process.env.JWT_SECRET || 'supersecret',
    });

    await app.register(rateLimit, {
      max: 20,
      timeWindow: '5s',
      redis: redisClient, // ✅ correct client instance
    });

    app.get('/health', async () => {
      return { status: 'ok' };
    });

    await app.register(chatPlugin);

    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
