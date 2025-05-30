// src/routes/authRoutes.ts
import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Login route
  fastify.post('/api/login', async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

  const token = jwt.sign(
  {
    id: user.id.toString(),
    email: user.email,
    name: user.name,
  },
  JWT_SECRET,
  { expiresIn: '1d' }
);


    return { token };
  });

  // Register a customer or agent



   fastify.post('/api/register', async (req, reply) => {
  const { email, password, role } = req.body as {
    email: string;
    password: string;
    role: 'CUSTOMER' | 'AGENT';
  };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return reply.code(400).send({ error: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name: role === 'AGENT' ? 'Agent' : 'Customer',
    },
  });

  return reply.code(201).send({ id: newUser.id.toString(), email: newUser.email });
});

};

export default authRoutes;
