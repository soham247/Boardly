import { Router } from 'express';
import { getTags, createTag } from '../controllers/tag.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/:boardId', getTags);
router.post('/:boardId/create', createTag);

export default router;
