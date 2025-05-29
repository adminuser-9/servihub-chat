import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const hash = (pw: string) => bcrypt.hashSync(pw, 10);

async function main() {
  // ─── Create Businesses ───────────────────────────
  const acme = await prisma.business.create({
    data: {
      name: 'Acme Corp',
    },
  });

  const globex = await prisma.business.create({
    data: {
      name: 'Globex Inc',
    },
  });

  // ─── Create Users ────────────────────────────────
  const agent1 = await prisma.user.create({
    data: {
      name: 'Alice Agent',
      email: 'alice@acme.com',
      passwordHash: hash('alicepass'),
      businessId: acme.id,
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      name: 'Bob Agent',
      email: 'bob@globex.com',
      passwordHash: hash('bobpass'),
      businessId: globex.id,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: 'Charlie Customer',
      email: 'charlie@example.com',
      passwordHash: hash('charliepass'),
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Dana Customer',
      email: 'dana@example.com',
      passwordHash: hash('danapass'),
    },
  });

  // ─── Create Conversations ────────────────────────
  await prisma.conversation.create({
    data: {
      businessId: acme.id,
      type: 'DIRECT',
      participants: {
        create: [
          { userId: agent1.id, role: 'AGENT' },
          { userId: customer1.id, role: 'CUSTOMER' },
        ],
      },
      messages: {
        create: [
          {
            senderId: customer1.id,
            body: 'Hi, I need help with my order.',
          },
          {
            senderId: agent1.id,
            body: 'Sure! What seems to be the issue?',
          },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      businessId: globex.id,
      type: 'SUPPORT_ROOM',
      participants: {
        create: [
          { userId: agent2.id, role: 'AGENT' },
          { userId: customer2.id, role: 'CUSTOMER' },
        ],
      },
      messages: {
        create: [
          {
            senderId: customer2.id,
            body: 'My app keeps crashing.',
          },
          {
            senderId: agent2.id,
            body: 'Let me look into that for you.',
          },
        ],
      },
    },
  });

  console.log('🌱 Seeded businesses, users, conversations, and messages.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
