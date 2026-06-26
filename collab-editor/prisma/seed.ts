import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 12);
  
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice Johnson', password, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice' },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob Smith', password, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob' },
  });

  const doc = await prisma.document.create({
    data: {
      title: 'Getting Started with CollabDocs',
      content: { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome to CollabDocs!' }] }, { type: 'paragraph', content: [{ type: 'text', text: 'This is a local-first collaborative document editor. Edit offline, sync when online.' }] }] },
      ownerId: user1.id,
      version: 1,
    },
  });

  await prisma.documentAccess.create({
    data: { documentId: doc.id, userId: user2.id, role: 'EDITOR' },
  });

  console.log('Seed data created', { user1: user1.email, user2: user2.email, doc: doc.title });
}

main().catch(console.error).finally(() => prisma.$disconnect());
