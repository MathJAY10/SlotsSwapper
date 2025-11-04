import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { swapRequestSchema, swapResponseSchema, validate } from '../utils/validation.js';
import { createSwapRequest, respondToSwapRequest } from '../services/swapService.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET swappable slots (marketplace)
router.get('/swappable-slots', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const slots = await prisma.event.findMany({
      where: {
        status: 'SWAPPABLE',
        ownerId: { not: req.user.id }
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { startTime: 'asc' },
      skip,
      take: limit
    });

    const total = await prisma.event.count({
      where: { status: 'SWAPPABLE', ownerId: { not: req.user.id } }
    });

    res.json({ slots, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create swap request
router.post('/swap-request', requireAuth, async (req, res) => {
  try {
    const data = validate(req.body, swapRequestSchema);
    const swapRequest = await createSwapRequest(req.user.id, data.mySlotId, data.theirSlotId);
    res.status(201).json(swapRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST respond to swap request
router.post('/swap-response/:requestId', requireAuth, async (req, res) => {
  try {
    const data = validate(req.body, swapResponseSchema);
    const result = await respondToSwapRequest(req.params.requestId, req.user.id, data.accept);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET all swap requests (incoming + outgoing)
router.get('/requests', requireAuth, async (req, res) => {
  try {
    const incoming = await prisma.swapRequest.findMany({
      where: { responderId: req.user.id },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        mySlot: true,
        theirSlot: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const outgoing = await prisma.swapRequest.findMany({
      where: { requesterId: req.user.id },
      include: {
        responder: { select: { id: true, name: true, email: true } },
        mySlot: true,
        theirSlot: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ incoming, outgoing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
