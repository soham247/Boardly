import mongoose from 'mongoose';
import { Notification } from '../models/notification.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/error.middleware.js';

const getNotifications = asyncHandler(async (req, res) => {
    const { limit = 10, page = 1, type = 'all' } = req.query;

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    const query = { recipientId: req.user._id };

    if (type === 'read') {
        query.isRead = true;
    } else if (type === 'unread') {
        query.isRead = false;
    }

    const [notifications, totalNotifications] = await Promise.all([
        Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum),
        Notification.countDocuments(query)
    ]);

    return res.status(200).json({
        notifications,
        pagination: {
            totalNotifications,
            currentPage: pageNum,
            totalPages: Math.ceil(totalNotifications / limitNum),
            limit: limitNum
        },
        message: 'Notifications fetched successfully',
    });
});

const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        recipientId: req.user._id,
        isRead: false,
    });

    return res.status(200).json({
        count,
        message: 'Unread notification count fetched successfully',
    });
});

const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(400, 'Invalid notification ID');
    }

    const notification = await Notification.findOneAndUpdate(
        { _id: id, recipientId: req.user._id },
        { $set: { isRead: true } },
        { new: true }
    );

    if (!notification) {
        throw new AppError(404, 'Notification not found');
    }

    return res.status(200).json({
        notification,
        message: 'Notification marked as read',
    });
});

const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipientId: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    return res.status(200).json({
        message: 'All notifications marked as read',
    });
});

export { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
