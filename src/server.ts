import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import chatPlugin from './plugins/chat';
import conversationRoutes from './routes/conversations';
import {businessRoutes} from './routes/business';
import authRoutes from './routes/auth';

dotenv.config();

const app = Fastify({ logger: true });
const redisClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

const start = async () => {
  try {
    // ← Move your cors registration inside start
    await app.register(cors, {
      origin: ['http://localhost:5173'], 
      methods: ['GET','POST','OPTIONS'],
      allowedHeaders: ['Content-Type','Authorization'],
    });

    // Other plugins
    await app.register(websocket);
    await app.register(jwt, { secret: process.env.JWT_SECRET || 'supersecret' });
    await app.register(rateLimit, { max: 20, timeWindow: '5s', redis: redisClient });

    // Routes
    app.get('/health', async () => ({ status: 'ok' }));
    app.register(conversationRoutes);
    app.register(authRoutes)
    app.register(businessRoutes);
    app.register(chatPlugin, { redis: redisClient });

    // Start listening
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
