import { Task } from '../models/task.model.js';
import { Board } from '../models/board.model.js';
import { Workspace } from '../models/workspace.model.js';
import { Tag } from '../models/tag.model.js';
import mongoose from 'mongoose';

// Check if a user is an owner or admin of the board's workspace
async function isWsOwnerOrAdmin(board, userId) {
  const workspace = await Workspace.findById(board.workspaceId);
  if (!workspace) return false;
  const member = workspace.members.find((m) => {
    const mid = m.user?._id ?? m.user;
    return mid?.toString() === userId.toString();
  });
  return member && (member.role === 'owner' || member.role === 'admin');
}

const createTask = async (req, res) => {
  try {
    const { title, description, boardId, assignedTo, status, priority, dueDate, tags } = req.body;

    if (!title || !boardId) {
      return res.status(400).json({ message: 'Title and boardId are required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check write permission — board-level or workspace owner/admin
    let hasWriteAccess = false;
    if (board.createdBy.toString() === req.user._id.toString()) {
      hasWriteAccess = true;
    } else {
      const member = board.members.find((m) => m.userId.toString() === req.user._id.toString());
      if (member && member.role === 'write') {
        hasWriteAccess = true;
      }
    }
    if (!hasWriteAccess) {
      hasWriteAccess = await isWsOwnerOrAdmin(board, req.user._id);
    }

    if (!hasWriteAccess) {
      return res
        .status(403)
        .json({ message: "You don't have write permission to create tasks on this board" });
    }

    // Verify assignedTo is a board member if provided
    if (assignedTo) {
      const isMember =
        board.members.some((m) => m.userId.toString() === assignedTo) ||
        board.createdBy.toString() === assignedTo;
      if (!isMember) {
        return res.status(400).json({ message: 'Assigned user is not a member of this board' });
      }
    }

    let validTags = [];
    if (Array.isArray(tags) && tags.length > 0) {
      const dbTags = await Tag.find({
        _id: { $in: tags },
        $or: [{ boardId: null }, { boardId: new mongoose.Types.ObjectId(boardId) }]
      });
      validTags = dbTags.map(tag => tag._id.toString());
    }

    const task = await Task.create({
      title,
      description,
      boardId,
      createdBy: req.user._id,
      assignedTo,
      status: status || 'todo',
      priority: priority || 'low',
      dueDate,
      tags: validTags,
    });

    await task.populate('assignedTo', 'fullName username avatar');
    await task.populate('createdBy', 'fullName username avatar');
    await task.populate('tags');

    return res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getTasksByBoard = async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check read permission — board member or workspace owner/admin
    const isMember =
      board.members.some((m) => m.userId.toString() === req.user._id.toString()) ||
      board.createdBy.toString() === req.user._id.toString();

    if (!isMember) {
      const wsAccess = await isWsOwnerOrAdmin(board, req.user._id);
      if (!wsAccess) {
        return res
          .status(403)
          .json({ message: "You don't have access to view tasks on this board" });
      }
    }

    const tasks = await Task.find({ boardId })
      .populate('assignedTo', 'fullName username avatar')
      .populate('createdBy', 'fullName username avatar')
      .populate('tags')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      message: 'Tasks fetched successfully',
      tasks,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, status, priority, dueDate, tags } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await Board.findById(task.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check write permission — board-level or workspace owner/admin
    let hasWriteAccess = false;
    if (board.createdBy.toString() === req.user._id.toString()) {
      hasWriteAccess = true;
    } else {
      const member = board.members.find((m) => m.userId.toString() === req.user._id.toString());
      if (member && member.role === 'write') {
        hasWriteAccess = true;
      }
    }
    if (!hasWriteAccess) {
      hasWriteAccess = await isWsOwnerOrAdmin(board, req.user._id);
    }

    if (!hasWriteAccess) {
      return res
        .status(403)
        .json({ message: "You don't have write permission to update tasks on this board" });
    }

    // Verify assignedTo is a board member if provided/changed
    if (assignedTo && assignedTo !== task.assignedTo?.toString()) {
      const isMember =
        board.members.some((m) => m.userId.toString() === assignedTo) ||
        board.createdBy.toString() === assignedTo;
      if (!isMember) {
        return res.status(400).json({ message: 'Assigned user is not a member of this board' });
      }
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) {
      if (Array.isArray(tags) && tags.length > 0) {
        const dbTags = await Tag.find({
          _id: { $in: tags },
          $or: [{ boardId: null }, { boardId: new mongoose.Types.ObjectId(task.boardId) }]
        });
        task.tags = dbTags.map(t => t._id.toString());
      } else {
        task.tags = [];
      }
    }

    await task.save();

    await task.populate('assignedTo', 'fullName username avatar');
    await task.populate('createdBy', 'fullName username avatar');
    await task.populate('tags');

    return res.status(200).json({
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await Board.findById(task.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check write permission — board-level or workspace owner/admin
    let hasWriteAccess = false;
    if (board.createdBy.toString() === req.user._id.toString()) {
      hasWriteAccess = true;
    } else {
      const member = board.members.find((m) => m.userId.toString() === req.user._id.toString());
      if (member && member.role === 'write') {
        hasWriteAccess = true;
      }
    }
    if (!hasWriteAccess) {
      hasWriteAccess = await isWsOwnerOrAdmin(board, req.user._id);
    }

    if (!hasWriteAccess) {
      return res
        .status(403)
        .json({ message: "You don't have write permission to delete tasks on this board" });
    }

    await task.deleteOne();

    return res.status(200).json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { createTask, getTasksByBoard, updateTask, deleteTask };
