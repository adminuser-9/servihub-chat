// src/types/fastify-jwt.d.ts
import 'fastify';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
    jwt: {
      sign: (...args: any[]) => string;
      verify: (...args: any[]) => any;
      decode: (...args: any[]) => any;
    };
  }
}
