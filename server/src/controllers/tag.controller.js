import { Tag } from '../models/tag.model.js';
import { Board } from '../models/board.model.js';
import { Workspace } from '../models/workspace.model.js';
import mongoose from 'mongoose';

const DEFAULT_TAGS = [
    { name: 'Bug', color: '#ef4444' },
    { name: 'Feature', color: '#3b82f6' },
    { name: 'Enhancement', color: '#10b981' },
    { name: 'Design', color: '#f59e0b' },
    { name: 'Frontend', color: '#8b5cf6' },
    { name: 'Backend', color: '#6366f1' },
];

const initializeDefaultTags = async () => {
    const existingCount = await Tag.countDocuments({ boardId: null });
    if (existingCount === 0) {
        await Tag.insertMany(DEFAULT_TAGS.map(tag => ({ ...tag, boardId: null, createdBy: null })));
    }
};

export const getTags = async (req, res) => {
    try {
        const { boardId } = req.params;

        await initializeDefaultTags();

        const query = { $or: [{ boardId: null }] };
        if (boardId) {
            query.$or.push({ boardId: new mongoose.Types.ObjectId(boardId) });
        }

        const tags = await Tag.find(query).sort({ boardId: 1, name: 1 });

        return res.status(200).json({
            message: 'Tags fetched successfully',
            tags,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const createTag = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { name, color } = req.body;

        if (!name || !color) {
            return res.status(400).json({ message: 'Name and color are required' });
        }

        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        const member = board.members.find((m) => m.userId.toString() === req.user._id.toString());
        const hasBoardWrite = member && member.role === 'write';

        let hasWriteAccess = hasBoardWrite || board.createdBy.toString() === req.user._id.toString();
        if (!hasWriteAccess) {
            const workspace = await Workspace.findById(board.workspaceId);
            const wsMember = workspace?.members.find((m) => {
                const mid = m.user?._id ?? m.user;
                return mid?.toString() === req.user._id.toString();
            });
            hasWriteAccess = wsMember && (wsMember.role === 'owner' || wsMember.role === 'admin');
        }

        if (!hasWriteAccess) {
            return res.status(403).json({ message: "You don't have write permission to create tags for this board" });
        }

        const tag = await Tag.create({
            name,
            color,
            boardId,
            createdBy: req.user._id,
        });

        return res.status(201).json({
            message: 'Tag created successfully',
            tag,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
