import { Router } from 'express';
import * as ratingController from './rating.controller';
import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { createRatingSchema, getRatingsQuerySchema } from '@/validators/rating.validator';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createRatingSchema), ratingController.rateUser);
router.get('/', validate(getRatingsQuerySchema), ratingController.getRatings);
router.patch('/:id', ratingController.updateRating);

export default router;
