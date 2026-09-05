import { Router } from 'express';
import { healthRouter } from './health.route';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);

// Phase 2+: apiRouter.use('/products', productRouter);
// Phase 2+: apiRouter.use('/categories', categoryRouter);
// Phase 3+: apiRouter.use('/orders', orderRouter);
// Phase 4+: apiRouter.use('/payments', paymentRouter);
// Phase 5+: apiRouter.use('/customers', customerRouter);
// Phase 6+: apiRouter.use('/vouchers', voucherRouter);
