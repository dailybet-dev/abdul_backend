import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!email || !password) {
    console.log('Admin bootstrap skipped: ADMIN_EMAIL or ADMIN_INITIAL_PASSWORD is not set.');
    return;
  }
  if (password.length < 14) throw new Error('ADMIN_INITIAL_PASSWORD must be at least 14 characters.');
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.adminUser.findFirst({ select: { email: true } });
    if (existing) {
      console.log('Admin bootstrap skipped: an administrator already exists.');
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.create({ data: { email, passwordHash } });
    console.log('Initial admin account created for:', email);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
