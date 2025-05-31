import 'fastify';
import Redis from 'ioredis';
import { FastifyJWTOptions } from '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
    jwt: FastifyJWTOptions; // or just `any` if you prefer
  }
}
