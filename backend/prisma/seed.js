import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Clean existing data
  await prisma.swapRequest.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});

  // Create users
  const user1 = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: await bcrypt.hash('password123', 10)
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: await bcrypt.hash('password123', 10)
    }
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Carol White',
      email: 'carol@example.com',
      password: await bcrypt.hash('password123', 10)
    }
  });

  // Create events
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  await prisma.event.create({
    data: {
      title: 'Team Meeting',
      startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0),
      endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0),
      status: 'SWAPPABLE',
      ownerId: user1.id
    }
  });

  await prisma.event.create({
    data: {
      title: 'Project Review',
      startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0),
      endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 0),
      status: 'SWAPPABLE',
      ownerId: user2.id
    }
  });

  await prisma.event.create({
    data: {
      title: 'Doctor Appointment',
      startTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 9, 0),
      endTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 10, 0),
      status: 'SWAPPABLE',
      ownerId: user3.id
    }
  });

  await prisma.event.create({
    data: {
      title: 'Lunch with friend',
      startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 0),
      endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 13, 0),
      status: 'BUSY',
      ownerId: user1.id
    }
  });

  console.log('✅ Seeding completed!');
  console.log(`Created 3 users and 4 events`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
