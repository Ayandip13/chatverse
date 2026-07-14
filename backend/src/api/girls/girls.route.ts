import { Router } from 'express';
import * as girlsController from './girls.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAuth, requireRole } from '@/middlewares/auth.middleware';
import { Role } from '@/constants/enums.constant';
import { getGirlsQuerySchema } from '@/validators/girls.validator';

const router = Router();

// Only authenticated boys can access discovery APIs
router.use(requireAuth);
router.use(requireRole([Role.BOY]));

router.get('/', validate(getGirlsQuerySchema), girlsController.getGirls);
router.get('/:id', girlsController.getGirlDetails);

export default router;
