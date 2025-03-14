import { Router } from 'express';
import { checkJwt } from '../middlewares/auth';
import apiController from '../controllers/api/apiController';
import { apiLimiter, authLimiter, dynamicApiLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Public routes with appropriate rate limits
// List APIs - Higher limit as it's commonly accessed
router.get('/', apiLimiter, apiController.getAllApis);

// Get single API details - Less restricted as it's a specific resource
router.get('/:id', apiLimiter, apiController.getApiById);
router.use(checkJwt);


router.post('/', authLimiter, apiController.createApi);

router.get('/user/me', apiLimiter, apiController.getMyApis);

router.get('/user/purchased', apiLimiter, apiController.getPurchasedApis);

router.put('/:id', authLimiter, apiController.updateApi);
router.delete('/:id', authLimiter, apiController.deleteApi);

router.post('/:apiId/endpoints', authLimiter, apiController.addEndpoint);
router.put('/:apiId/endpoints/:endpointId', authLimiter, apiController.updateEndpoint);
router.delete('/:apiId/endpoints/:endpointId', authLimiter, apiController.deleteEndpoint);

router.post('/:apiId/purchase', authLimiter, apiController.purchaseApi);

export default router;