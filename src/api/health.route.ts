import { Router } from 'express';
import { prisma } from '../database/prisma';
import { storeConfig } from '../config/store';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let databaseOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  const status = databaseOk ? 200 : 503;

  res.status(status).json({
    success: databaseOk,
    store: storeConfig.name,
    timezone: storeConfig.timezone,
    database: databaseOk ? 'up' : 'down',
    timestamp: new Date().toISOString(),
  });
});
