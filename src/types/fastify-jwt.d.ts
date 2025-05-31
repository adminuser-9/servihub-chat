import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    jwt: {
      sign: <T extends object>(payload: T) => string;
      verify: <T>(token: string) => T;
      decode: (token: string) => object | null;
    };
  }
}
