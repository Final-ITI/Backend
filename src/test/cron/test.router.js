import express from 'express';
import { triggerDeductJob } from './test.controller.js'; 
import { authorize, authenticate} from '../../middlewares/auth.middleware.js'; 

const router = express.Router();

router.post('/trigger-deduct-job', authenticate, authorize('superadmin'), triggerDeductJob);

export default router;