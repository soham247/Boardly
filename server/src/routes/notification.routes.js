import { Router } from 'express';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from '../controllers/notification.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();


router.use(verifyJWT);

router.route('/').get(getNotifications);
router.route('/unread-count').get(getUnreadCount);
router.route('/read-all').put(markAllAsRead);
router.route('/:id/read').put(markAsRead); // Keep explicit parameter routes last to avoid capturing literal routes

export default router;
