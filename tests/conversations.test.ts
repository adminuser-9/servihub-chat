import Fastify from 'fastify';
import authRoutes from '../src/routes/auth';
import conversationRoutes from '../src/routes/conversations';
import jwt from '@fastify/jwt';
import supertest from 'supertest';

const app = Fastify();
app.register(jwt, { secret: 'test-secret' });
app.register(authRoutes);
app.register(conversationRoutes);

let token: string;

beforeAll(async () => {
  await app.ready();
  token = app.jwt.sign({ id: '1', email: 'user@test.com', name: 'Test' });
});

afterAll(async () => {
  await app.close();
});

test('GET /api/conversations/:id/messages should 401 without token', async () => {
  const response = await supertest(app.server).get('/api/conversations/1/messages');
  expect(response.statusCode).toBe(401);
});

test('GET /api/conversations/:id/messages should return 200', async () => {
  const response = await supertest(app.server)
    .get('/api/conversations/1/messages')
    .set('Authorization', `Bearer ${token}`);

  expect(response.statusCode).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
});
