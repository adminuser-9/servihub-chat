// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1) Create two businesses
  const biz1 = await prisma.business.create({
    data: { name: 'Acme Corp' },
  });
  const biz2 = await prisma.business.create({
    data: { name: 'Globex' },
  });

  // 2) Create one customer and one agent
  const customer = await prisma.user.create({
    data: { /* any required fields on User */ },
  });
  const agent = await prisma.user.create({
    data: { /* any required fields on User */ },
  });

  // 3) Create a conversation between customer and biz1
  const convo = await prisma.conversation.create({
    data: {
      businessId: biz1.id,
      type: 'DIRECT',        // or SUPPORT_ROOM per your enum
      participants: {
        create: [
          { userId: customer.id, role: 'CUSTOMER' },
          { userId: agent.id,     role: 'AGENT'    },
        ],
      },
      messages: {
        create: [
          {
            senderId: customer.id,
            body: 'Hello, I need help with my order.',
          },
          {
            senderId: agent.id,
            body: 'Sure thing — what’s your order number?',
          },
        ],
      },
    },
  });

  console.log('🌱 Seeded:', { biz1, biz2, customer, agent, convo });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
