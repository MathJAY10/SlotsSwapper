
# SlotSwapper - Peer-to-Peer Time Slot Swapping Platform

## What is SlotSwapper?

SlotSwapper is a platform where users can swap their calendar events with other users. Instead of being stuck with a bad time slot, you can trade it with someone else who wants it.

## Why Swap Events?

**Example:**
- You have: Doctor Appointment at 3 PM
- You also have: Important Meeting at 3 PM (CONFLICT!)
- Your colleague Bob has: Coffee Break at 2 PM

Solution: Swap your Doctor Appointment with Bob's Coffee Break. Now you're free at 3 PM!

## Features

- User authentication with JWT
- Create, update, delete events
- Mark events as SWAPPABLE or BUSY
- Browse marketplace for swappable events
- Request swaps with other users
- Accept/reject swap requests
- Automatic event exchange after approval

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, Prisma
**Frontend:** React, Vite, React Router, Bootstrap 5, Zustand

## Quick Start

### Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev# SlotsSwapper
