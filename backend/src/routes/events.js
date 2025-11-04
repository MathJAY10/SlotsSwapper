import express from 'express';
import { PrismaClient } from '@prisma/client';
import { eventSchema, validate } from '../utils/validation.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Check for overlapping events
const hasOverlap = (events, startTime, endTime, excludeId = null) => {
  const newStart = new Date(startTime);
  const newEnd = new Date(endTime);
  return events.some(e => {
    if (excludeId && e.id === excludeId) return false;
    const eStart = new Date(e.startTime);
    const eEnd = new Date(e.endTime);
    return newStart < eEnd && newEnd > eStart;
  });
};

// GET all user events
router.get('/', requireAuth, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { ownerId: req.user.id },
      orderBy: { startTime: 'asc' }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create event
router.post('/', requireAuth, async (req, res) => {
  try {
    const data = validate(req.body, eventSchema);
    
    const userEvents = await prisma.event.findMany({
      where: { ownerId: req.user.id }
    });
    
    if (hasOverlap(userEvents, data.startTime, data.endTime)) {
      return res.status(400).json({ error: 'Event overlaps with existing event' });
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        status: data.status || 'BUSY',
        ownerId: req.user.id
      }
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH update event
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.ownerId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE event
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.ownerId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
