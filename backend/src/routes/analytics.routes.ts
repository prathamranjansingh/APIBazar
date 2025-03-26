import { Router } from 'express';
import { checkJwt, extractUser } from '../middlewares/auth';
import analyticsController from '../controllers/analytics/analyticsController';
import { apiLimiter, authLimiter } from '../middlewares/rateLimiter';
import { checkApiOwner } from '../middlewares/analyticsMiddleware';

const router = Router();

router.use((req, res, next) => {
    checkJwt(req, res, (err) => {
      if (err) return next(err);
      extractUser(req, res, next);
    });
  });

// API creator routes
router.get('/my', apiLimiter, analyticsController.getMyApiAnalytics);

// API-specific analytics routes (only allow owners)
router.get('/api/:apiId/complete', apiLimiter, checkApiOwner, analyticsController.getCompleteApiAnalytics);
router.get('/api/:apiId', apiLimiter, checkApiOwner, analyticsController.getApiAnalytics);
router.get('/api/:apiId/timeseries', apiLimiter, checkApiOwner, analyticsController.getApiTimeSeriesData);

// Consumer routes (ownership check not needed)
router.get('/purchased', apiLimiter, analyticsController.getPurchasedApiAnalytics);

// System route (ownership check not needed)
router.post('/update', authLimiter, analyticsController.updateMetrics);

export default router;
