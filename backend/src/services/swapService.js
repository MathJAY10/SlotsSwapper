import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates a swap request with transaction protection
 * - Verifies both events are SWAPPABLE
 * - Marks both events as SWAP_PENDING atomically
 * - Prevents race conditions with transaction
 */
export const createSwapRequest = async (requesterId, mySlotId, theirSlotId) => {
  return await prisma.$transaction(async (tx) => {
    // Fetch both events within transaction
    const mySlot = await tx.event.findUnique({ where: { id: mySlotId } });
    const theirSlot = await tx.event.findUnique({ where: { id: theirSlotId } });

    if (!mySlot || !theirSlot) throw new Error('Event not found');
    if (mySlot.status !== 'SWAPPABLE') throw new Error('Your slot is not swappable');
    if (theirSlot.status !== 'SWAPPABLE') throw new Error('Their slot is not swappable');
    if (mySlot.ownerId !== requesterId) throw new Error('You do not own your slot');
    if (theirSlot.ownerId === requesterId) throw new Error('Cannot swap with yourself');

    // Create swap request
    const swapRequest = await tx.swapRequest.create({
      data: {
        requesterId,
        responderId: theirSlot.ownerId,
        mySlotId,
        theirSlotId,
        status: 'PENDING'
      }
    });

    // Mark both slots as SWAP_PENDING atomically
    await tx.event.update({
      where: { id: mySlotId },
      data: { status: 'SWAP_PENDING' }
    });

    await tx.event.update({
      where: { id: theirSlotId },
      data: { status: 'SWAP_PENDING' }
    });

    return swapRequest;
  });
};

/**
 * Responds to swap request (accept/reject) with atomic owner swap
 * - Validates responder is the event owner
 * - Re-checks event statuses are still SWAP_PENDING (race condition guard)
 * - Atomically swaps owners if accepted
 * - Reverts to SWAPPABLE if rejected
 */
export const respondToSwapRequest = async (requestId, responderId, accept) => {
  return await prisma.$transaction(async (tx) => {
    const swapRequest = await tx.swapRequest.findUnique({
      where: { id: requestId }
    });

    if (!swapRequest) throw new Error('Swap request not found');
    if (swapRequest.responderId !== responderId) throw new Error('Unauthorized');
    if (swapRequest.status !== 'PENDING') throw new Error('Request already responded');

    // Re-fetch events to ensure current state (race condition check)
    const mySlot = await tx.event.findUnique({ where: { id: swapRequest.mySlotId } });
    const theirSlot = await tx.event.findUnique({ where: { id: swapRequest.theirSlotId } });

    if (!mySlot || !theirSlot) throw new Error('Event not found');

    if (accept) {
      // Ensure both are still SWAP_PENDING before accepting
      if (mySlot.status !== 'SWAP_PENDING' || theirSlot.status !== 'SWAP_PENDING') {
        throw new Error('One or both slots are no longer pending swap');
      }

      // Swap owners atomically
      await tx.event.update({
        where: { id: swapRequest.mySlotId },
        data: { ownerId: theirSlot.ownerId, status: 'BUSY' }
      });

      await tx.event.update({
        where: { id: swapRequest.theirSlotId },
        data: { ownerId: mySlot.ownerId, status: 'BUSY' }
      });

      // Update swap request
      await tx.swapRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED', respondedAt: new Date() }
      });
    } else {
      // Reject: revert both events to SWAPPABLE
      await tx.event.update({
        where: { id: swapRequest.mySlotId },
        data: { status: 'SWAPPABLE' }
      });

      await tx.event.update({
        where: { id: swapRequest.theirSlotId },
        data: { status: 'SWAPPABLE' }
      });

      await tx.swapRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED', respondedAt: new Date() }
      });
    }

    return await tx.swapRequest.findUnique({ where: { id: requestId } });
  });
};
