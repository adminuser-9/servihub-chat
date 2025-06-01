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
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
dotenv.config();

const app = Fastify({ logger: true });

const redisClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

const start = async () => {
  try {
    // ← Move your cors registration inside start
   

    // Other plugins
    await app.register(websocket);
    await app.register(jwt, { secret: process.env.JWT_SECRET || 'supersecret' });
    await app.register(rateLimit, { max: 20, timeWindow: '5s', redis: redisClient });
    await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5174'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

    app.setNotFoundHandler((_req, reply) => {
  const indexPath = path.join(__dirname, '../client/dist/index.html');
  reply.type('text/html').send(fs.readFileSync(indexPath));
});
    app.register(fastifyStatic, {
  root: path.join(__dirname, '../client/dist'),
  prefix: '/',
});

    // Routes
    app.get('/health', async () => ({ status: 'ok' }));
    app.register(conversationRoutes);
    app.register(authRoutes)
    app.register(businessRoutes);
    app.register(chatPlugin, { redis: redisClient });

    // Start listening
 const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log('Server running at https://servihub-chat.onrender.com');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
