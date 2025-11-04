import { respondToSwapRequest, createSwapRequest } from '../src/services/swapService.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Swap Response - Concurrency & Transaction Tests', () => {
  let user1, user2;
  let event1, event2;
  let swapRequest;

  beforeAll(async () => {
    // Clean up before tests
    await prisma.swapRequest.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    user1 = await prisma.user.create({
      data: {
        name: 'Test User 1',
        email: 'test1@example.com',
        password: await bcrypt.hash('test123', 10)
      }
    });

    user2 = await prisma.user.create({
      data: {
        name: 'Test User 2',
        email: 'test2@example.com',
        password: await bcrypt.hash('test123', 10)
      }
    });

    // Create test events
    const now = new Date();
    event1 = await prisma.event.create({
      data: {
        title: 'Event 1',
        startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        status: 'SWAPPABLE',
        ownerId: user1.id
      }
    });

    event2 = await prisma.event.create({
      data: {
        title: 'Event 2',
        startTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        status: 'SWAPPABLE',
        ownerId: user2.id
      }
    });

    // Create swap request
    swapRequest = await createSwapRequest(user1.id, event1.id, event2.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should accept swap and swap owners atomically', async () => {
    const result = await respondToSwapRequest(swapRequest.id, user2.id, true);

    expect(result.status).toBe('ACCEPTED');
    expect(result.respondedAt).not.toBeNull();

    // Verify events were swapped
    const updatedEvent1 = await prisma.event.findUnique({ where: { id: event1.id } });
    const updatedEvent2 = await prisma.event.findUnique({ where: { id: event2.id } });

    expect(updatedEvent1.ownerId).toBe(user2.id);
    expect(updatedEvent2.ownerId).toBe(user1.id);
    expect(updatedEvent1.status).toBe('BUSY');
    expect(updatedEvent2.status).toBe('BUSY');
  });

  test('should reject swap and revert to SWAPPABLE', async () => {
    // Create another swap request
    const event3 = await prisma.event.create({
      data: {
        title: 'Event 3',
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
        status: 'SWAPPABLE',
        ownerId: user1.id
      }
    });

    const event4 = await prisma.event.create({
      data: {
        title: 'Event 4',
        startTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
        endTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
        status: 'SWAPPABLE',
        ownerId: user2.id
      }
    });

    const newSwapRequest = await createSwapRequest(user1.id, event3.id, event4.id);
    const result = await respondToSwapRequest(newSwapRequest.id, user2.id, false);

    expect(result.status).toBe('REJECTED');

    // Verify events reverted to SWAPPABLE
    const updatedEvent3 = await prisma.event.findUnique({ where: { id: event3.id } });
    const updatedEvent4 = await prisma.event.findUnique({ where: { id: event4.id } });

    expect(updatedEvent3.status).toBe('SWAPPABLE');
    expect(updatedEvent4.status).toBe('SWAPPABLE');
  });

  test('should prevent unauthorized response', async () => {
    const event5 = await prisma.event.create({
      data: {
        title: 'Event 5',
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
        status: 'SWAPPABLE',
        ownerId: user1.id
      }
    });

    const event6 = await prisma.event.create({
      data: {
        title: 'Event 6',
        startTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
        endTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
        status: 'SWAPPABLE',
        ownerId: user2.id
      }
    });

    const newSwapRequest = await createSwapRequest(user1.id, event5.id, event6.id);

    try {
      await respondToSwapRequest(newSwapRequest.id, user1.id, true);
      throw new Error('Should have thrown');
    } catch (error) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});
