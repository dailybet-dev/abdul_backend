import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!email || !password || password.length < 14) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD (at least 14 characters) before running npm run admin:create.');
  }
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash, isActive: true },
      create: { email, passwordHash },
    });
    console.log('Admin account created/updated for:', email);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
