import authRoutes from './auth.js';
import eventsRoutes from './events.js';
import swapsRoutes from './swaps.js';

export const setupRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api', swapsRoutes);
};
